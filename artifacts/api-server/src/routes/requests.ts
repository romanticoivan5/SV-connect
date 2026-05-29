import { Router, type IRouter } from "express";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { db, requestsTable, usersTable, notificationsTable } from "@workspace/db";
import {
  ListRequestsQueryParams,
  GetRequestParams,
  CreateRequestBody,
  UpdateRequestParams,
  UpdateRequestBody,
  ApproveRequestParams,
  ApproveRequestBody,
  RejectRequestParams,
  RejectRequestBody,
  ListMyRequestsQueryParams,
} from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function toRequestResponse(row: {
  request: typeof requestsTable.$inferSelect;
  user: typeof usersTable.$inferSelect | null;
}) {
  const r = row.request;
  return {
    id: r.id,
    userId: r.userId,
    user: row.user
      ? {
          id: row.user.id,
          firstName: row.user.firstName,
          lastName: row.user.lastName,
          email: row.user.email,
          role: row.user.role,
          status: row.user.status,
          address: row.user.address ?? null,
          contactNumber: row.user.contactNumber ?? null,
          createdAt: row.user.createdAt.toISOString(),
          updatedAt: row.user.updatedAt?.toISOString() ?? null,
        }
      : undefined,
    type: r.type,
    status: r.status,
    subject: r.subject,
    description: r.description,
    remarks: r.remarks ?? null,
    processedBy: r.processedBy ?? null,
    processedAt: r.processedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
}

router.get("/requests/my", authenticate, async (req, res): Promise<void> => {
  const params = ListMyRequestsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { status, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;
  const conditions = [eq(requestsTable.userId, req.user!.userId)];

  if (status) {
    conditions.push(eq(requestsTable.status, status as "pending" | "approved" | "rejected"));
  }

  const where = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(requestsTable)
    .where(where);

  const rows = await db
    .select({ request: requestsTable, user: usersTable })
    .from(requestsTable)
    .leftJoin(usersTable, eq(requestsTable.userId, usersTable.id))
    .where(where)
    .orderBy(desc(requestsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    data: rows.map(toRequestResponse),
    total: countResult.count,
    page,
    limit,
  });
});

router.get("/requests", authenticate, async (req, res): Promise<void> => {
  const params = ListRequestsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { status, type, userId, search, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (req.user!.role !== "admin") {
    conditions.push(eq(requestsTable.userId, req.user!.userId));
  }

  if (status) {
    conditions.push(eq(requestsTable.status, status as "pending" | "approved" | "rejected"));
  }
  if (type) {
    conditions.push(
      eq(
        requestsTable.type,
        type as
          | "barangay_clearance"
          | "certificate_of_residency"
          | "business_permit"
          | "complaint"
          | "community_concern"
      )
    );
  }
  if (userId) {
    conditions.push(eq(requestsTable.userId, userId));
  }
  if (search) {
    conditions.push(
      sql`(${like(requestsTable.subject, `%${search}%`)} OR ${like(requestsTable.description, `%${search}%`)})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(requestsTable)
    .where(where);

  const rows = await db
    .select({ request: requestsTable, user: usersTable })
    .from(requestsTable)
    .leftJoin(usersTable, eq(requestsTable.userId, usersTable.id))
    .where(where)
    .orderBy(desc(requestsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    data: rows.map(toRequestResponse),
    total: countResult.count,
    page,
    limit,
  });
});

router.post("/requests", authenticate, async (req, res): Promise<void> => {
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db
    .insert(requestsTable)
    .values({ ...parsed.data, userId: req.user!.userId })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));

  res.status(201).json(toRequestResponse({ request, user }));
});

router.get("/requests/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ request: requestsTable, user: usersTable })
    .from(requestsTable)
    .leftJoin(usersTable, eq(requestsTable.userId, usersTable.id))
    .where(eq(requestsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (req.user!.role !== "admin" && row.request.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(toRequestResponse(row));
});

router.patch("/requests/:id", authenticate, async (req, res): Promise<void> => {
  const params = UpdateRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (existing.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (existing.status !== "pending") {
    res.status(400).json({ error: "Can only edit pending requests" });
    return;
  }

  const [updated] = await db
    .update(requestsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(requestsTable.id, params.data.id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));

  res.json(toRequestResponse({ request: updated, user }));
});

router.patch("/requests/:id/approve", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = ApproveRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ApproveRequestBody.safeParse(req.body);
  const remarks = body.success ? body.data.remarks : undefined;

  const [updated] = await db
    .update(requestsTable)
    .set({
      status: "approved",
      remarks: remarks ?? null,
      processedBy: req.user!.userId,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requestsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  // Create notification for the resident
  await db.insert(notificationsTable).values({
    userId: updated.userId,
    title: "Request Approved",
    message: `Your request "${updated.subject}" has been approved.${remarks ? ` Remarks: ${remarks}` : ""}`,
    type: "request_approved",
    requestId: updated.id,
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));

  res.json(toRequestResponse({ request: updated, user }));
});

router.patch("/requests/:id/reject", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = RejectRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = RejectRequestBody.safeParse(req.body);
  const remarks = body.success ? body.data.remarks : undefined;

  const [updated] = await db
    .update(requestsTable)
    .set({
      status: "rejected",
      remarks: remarks ?? null,
      processedBy: req.user!.userId,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requestsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  // Create notification for the resident
  await db.insert(notificationsTable).values({
    userId: updated.userId,
    title: "Request Rejected",
    message: `Your request "${updated.subject}" has been rejected.${remarks ? ` Reason: ${remarks}` : ""}`,
    type: "request_rejected",
    requestId: updated.id,
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));

  res.json(toRequestResponse({ request: updated, user }));
});

export default router;
