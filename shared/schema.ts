import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  category: text("category").notNull(),
  duration: integer("duration").notNull(), // in seconds
  url: text("url").notNull(), // file path or external URL
  artwork: text("artwork"), // artwork URL or path
  isFavorite: boolean("is_favorite").default(false),
  uploadType: text("upload_type").notNull(), // 'file' or 'url'
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
});

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
