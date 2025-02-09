import { cards, type Card, type InsertCard } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createCard(card: InsertCard): Promise<Card>;
  getCard(id: number): Promise<Card | undefined>;
  listCards(): Promise<Card[]>;
}

export class DatabaseStorage implements IStorage {
  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db.insert(cards).values(insertCard).returning();
    return card;
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async listCards(): Promise<Card[]> {
    return await db.select().from(cards);
  }
}

export const storage = new DatabaseStorage();