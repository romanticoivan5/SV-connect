import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { authenticate, signToken } from "../middlewares/auth";

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

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { firstName, lastName, email, password, address, contactNumber } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // New accounts are created with status "pending" — admin must approve
  const [user] = await db
    .insert(usersTable)
    .values({ firstName, lastName, email, passwordHash, address, contactNumber, status: "pending" })
    .returning();

  // Return a token so the generated client works — the mobile app checks user.status === "pending"
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.status(201).json({ token, user: toUserResponse(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.status === "pending") {
    res.status(403).json({ error: "pending", message: "Your account is awaiting approval by the barangay admin. Please check back later." });
    return;
  }

  if (user.status === "disabled") {
    res.status(403).json({ error: "disabled", message: "Your account has been disabled. Please contact the barangay office." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.json({ token, user: toUserResponse(user) });
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
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

export default router;
