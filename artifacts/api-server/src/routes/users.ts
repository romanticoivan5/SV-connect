import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, like, and, sql } from "drizzle-orm";
import { db, usersTable, notificationsTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DisableUserParams,
  EnableUserParams,
  UpdateProfileBody,
} from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function toUserResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    address: user.address ?? null,
    contactNumber: user.contactNumber ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt?.toISOString() ?? null,
  };
}

router.get("/users", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search, role, status, page = 1, limit = 20 } = params.data;

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${like(usersTable.firstName, `%${search}%`)} OR ${like(usersTable.lastName, `%${search}%`)} OR ${like(usersTable.email, `%${search}%`)})`
    );
  }
  if (role) {
    conditions.push(eq(usersTable.role, role as "admin" | "resident"));
  }
  if (status) {
    conditions.push(eq(usersTable.status, status as "active" | "disabled" | "pending"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * limit;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(where);

  const users = await db
    .select()
    .from(usersTable)
    .where(where)
    .orderBy(usersTable.createdAt)
    .limit(limit)
    .offset(offset);

  res.json({
    data: users.map(toUserResponse),
    total: countResult.count,
    page,
    limit,
  });
});

router.get("/users/profile", authenticate, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toUserResponse(user));
});

router.patch("/users/profile", authenticate, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.user!.userId))
    .returning();

  res.json(toUserResponse(user));
});

router.get("/users/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toUserResponse(user));
});

router.patch("/users/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toUserResponse(user));
});

router.patch("/users/:id/disable", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = DisableUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ status: "disabled", updatedAt: new Date() })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toUserResponse(user));
});

router.patch("/users/:id/enable", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = EnableUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toUserResponse(user));
});

// Approve a pending account — sets status to "active" and notifies the user
router.patch("/users/:id/approve", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.insert(notificationsTable).values({
    userId: user.id,
    title: "Account Approved",
    message: `Welcome, ${user.firstName}! Your SV Connect account has been approved. You can now access all resident services.`,
    type: "account_approved",
  });

  res.json(toUserResponse(user));
});

// Reject a pending account — sets status to "disabled"
router.patch("/users/:id/reject", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ status: "disabled", updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toUserResponse(user));
});

export default router;
