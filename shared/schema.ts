import { pgTable, text, serial, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  occasion: text("occasion").notNull(),
  recipientName: text("recipient_name").notNull(),
  senderName: text("sender_name").notNull(),
  date: text("date").notNull(),
  message: text("message").notNull(),
  backgroundUrl: text("background_url").notNull(),
  decorations: json("decorations").$type<string[]>().notNull(),
  additionalContext: text("additional_context"),
});

export const insertCardSchema = createInsertSchema(cards).omit({ id: true });

export const occasions = [
  "Birthday",
  "Wedding",
  "Anniversary",
  "Graduation",
  "New Baby",
  "Get Well",
  "Thank You",
  "Holiday",
  "Sympathy",
  "Congratulations",
  "Other"
] as const;

export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;
