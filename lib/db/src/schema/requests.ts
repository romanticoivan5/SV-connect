import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const requestsTable = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  type: text("type", {
    enum: ["barangay_clearance", "certificate_of_residency", "business_permit", "complaint", "community_concern"],
  }).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  remarks: text("remarks"),
  processedBy: integer("processed_by").references(() => usersTable.id),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
});
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requestsTable.$inferSelect;
