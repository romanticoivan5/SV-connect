import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, announcementsTable, usersTable } from "@workspace/db";
import {
  ListAnnouncementsQueryParams,
  GetAnnouncementParams,
  CreateAnnouncementBody,
  UpdateAnnouncementParams,
  UpdateAnnouncementBody,
  DeleteAnnouncementParams,
} from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function toAnnouncementResponse(row: {
  announcement: typeof announcementsTable.$inferSelect;
  author: typeof usersTable.$inferSelect | null;
}) {
  const a = row.announcement;
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    category: a.category ?? null,
    authorId: a.authorId,
    author: row.author
      ? {
          id: row.author.id,
          firstName: row.author.firstName,
          lastName: row.author.lastName,
          email: row.author.email,
          role: row.author.role,
          status: row.author.status,
          address: row.author.address ?? null,
          contactNumber: row.author.contactNumber ?? null,
          createdAt: row.author.createdAt.toISOString(),
          updatedAt: row.author.updatedAt?.toISOString() ?? null,
        }
      : undefined,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt?.toISOString() ?? null,
  };
}

router.get("/announcements", authenticate, async (req, res): Promise<void> => {
  const params = ListAnnouncementsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(announcementsTable);

  const rows = await db
    .select({ announcement: announcementsTable, author: usersTable })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .orderBy(desc(announcementsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    data: rows.map(toAnnouncementResponse),
    total: countResult.count,
    page,
    limit,
  });
});

router.post("/announcements", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [announcement] = await db
    .insert(announcementsTable)
    .values({ ...parsed.data, authorId: req.user!.userId })
    .returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, announcement.authorId));

  res.status(201).json(toAnnouncementResponse({ announcement, author }));
});

router.get("/announcements/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ announcement: announcementsTable, author: usersTable })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .where(eq(announcementsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json(toAnnouncementResponse(row));
});

router.patch("/announcements/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [announcement] = await db
    .update(announcementsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(announcementsTable.id, params.data.id))
    .returning();

  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, announcement.authorId));

  res.json(toAnnouncementResponse({ announcement, author }));
});

router.delete("/announcements/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(announcementsTable)
    .where(eq(announcementsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
