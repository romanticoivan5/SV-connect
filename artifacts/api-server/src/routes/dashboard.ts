import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, requestsTable, announcementsTable, notificationsTable } from "@workspace/db";
import { GetRecentRequestsQueryParams } from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const [totalResidentsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "resident"));

  const [totalRequestsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requestsTable);

  const [pendingResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requestsTable)
    .where(eq(requestsTable.status, "pending"));

  const [approvedResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requestsTable)
    .where(eq(requestsTable.status, "approved"));

  const [rejectedResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requestsTable)
    .where(eq(requestsTable.status, "rejected"));

  const [announcementsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(announcementsTable);

  // "recent activity" = requests submitted in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [recentActivityResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requestsTable)
    .where(sql`${requestsTable.createdAt} >= ${sevenDaysAgo}`);

  res.json({
    totalResidents: totalResidentsResult.count,
    totalRequests: totalRequestsResult.count,
    pendingRequests: pendingResult.count,
    approvedRequests: approvedResult.count,
    rejectedRequests: rejectedResult.count,
    totalAnnouncements: announcementsResult.count,
    recentActivity: recentActivityResult.count,
  });
});

router.get("/dashboard/recent-requests", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = GetRecentRequestsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 10) : 10;

  const rows = await db
    .select({ request: requestsTable, user: usersTable })
    .from(requestsTable)
    .leftJoin(usersTable, eq(requestsTable.userId, usersTable.id))
    .orderBy(desc(requestsTable.createdAt))
    .limit(limit);

  const data = rows.map((row) => ({
    id: row.request.id,
    userId: row.request.userId,
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
    type: row.request.type,
    status: row.request.status,
    subject: row.request.subject,
    description: row.request.description,
    remarks: row.request.remarks ?? null,
    processedBy: row.request.processedBy ?? null,
    processedAt: row.request.processedAt?.toISOString() ?? null,
    createdAt: row.request.createdAt.toISOString(),
    updatedAt: row.request.updatedAt?.toISOString() ?? null,
  }));

  res.json(data);
});

router.get("/dashboard/request-breakdown", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const byTypeRows = await db
    .select({
      label: requestsTable.type,
      count: sql<number>`count(*)::int`,
    })
    .from(requestsTable)
    .groupBy(requestsTable.type);

  const byStatusRows = await db
    .select({
      label: requestsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(requestsTable)
    .groupBy(requestsTable.status);

  res.json({
    byType: byTypeRows,
    byStatus: byStatusRows,
  });
});

export default router;
