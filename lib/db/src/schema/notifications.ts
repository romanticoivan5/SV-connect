import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { requestsTable } from "./requests";

export const notificationsTable = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  requestId: integer("request_id").references(() => requestsTable.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
