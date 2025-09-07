import { users, tracks, type User, type InsertUser, type Track, type InsertTrack } from "@shared/schema";
import { db } from "./db";
import { eq, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Track operations
  getAllTracks(): Promise<Track[]>;
  getTrack(id: string): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined>;
  deleteTrack(id: string): Promise<boolean>;
  searchTracks(query: string): Promise<Track[]>;
  getTracksByCategory(category: string): Promise<Track[]>;
  toggleFavorite(id: string): Promise<Track | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks);
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db
      .insert(tracks)
      .values(insertTrack)
      .returning();
    return track;
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined> {
    const [track] = await db
      .update(tracks)
      .set(updates)
      .where(eq(tracks.id, id))
      .returning();
    return track || undefined;
  }

  async deleteTrack(id: string): Promise<boolean> {
    const result = await db
      .delete(tracks)
      .where(eq(tracks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async searchTracks(query: string): Promise<Track[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(tracks).where(
      or(
        ilike(tracks.title, searchTerm),
        ilike(tracks.artist, searchTerm),
        ilike(tracks.category, searchTerm)
      )
    );
  }

  async getTracksByCategory(category: string): Promise<Track[]> {
    if (category === "All Categories") {
      return this.getAllTracks();
    }
    return await db.select().from(tracks).where(ilike(tracks.category, category));
  }

  async toggleFavorite(id: string): Promise<Track | undefined> {
    const [track] = await db
      .update(tracks)
      .set({ isFavorite: sql`not ${tracks.isFavorite}` })
      .where(eq(tracks.id, id))
      .returning();
    return track || undefined;
  }
}

export const storage = new DatabaseStorage();
