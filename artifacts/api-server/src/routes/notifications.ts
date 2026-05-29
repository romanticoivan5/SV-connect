import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsQueryParams,
  MarkNotificationReadParams,
} from "@workspace/api-zod";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

function toNotificationResponse(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type ?? null,
    isRead: n.isRead,
    requestId: n.requestId ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", authenticate, async (req, res): Promise<void> => {
  const params = ListNotificationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { unreadOnly } = params.data;
  const conditions = [eq(notificationsTable.userId, req.user!.userId)];

  if (unreadOnly) {
    conditions.push(eq(notificationsTable.isRead, false));
  }

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(and(...conditions))
    .orderBy(desc(notificationsTable.createdAt));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.json({
    data: notifications.map(toNotificationResponse),
    unreadCount,
  });
});

router.patch("/notifications/:id/read", authenticate, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, params.data.id),
        eq(notificationsTable.userId, req.user!.userId)
      )
    )
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(toNotificationResponse(notification));
});

router.patch("/notifications/read-all", authenticate, async (req, res): Promise<void> => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.userId, req.user!.userId),
        eq(notificationsTable.isRead, false)
      )
    );

  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
