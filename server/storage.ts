import { 
  transcripts, 
  type Transcript, 
  type InsertTranscript, 
  users, 
  type User, 
  type InsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transcript operations
  getAllTranscripts(): Promise<Transcript[]>;
  getTranscript(id: number): Promise<Transcript | undefined>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  updateTranscript(id: number, transcript: Partial<InsertTranscript>): Promise<Transcript | undefined>;
  deleteTranscript(id: number): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Transcript methods
  async getAllTranscripts(): Promise<Transcript[]> {
    return await db.select().from(transcripts).orderBy(desc(transcripts.createdAt));
  }

  async getTranscript(id: number): Promise<Transcript | undefined> {
    const result = await db.select().from(transcripts).where(eq(transcripts.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const result = await db.insert(transcripts).values(insertTranscript).returning();
    return result[0];
  }

  async updateTranscript(id: number, updateData: Partial<InsertTranscript>): Promise<Transcript | undefined> {
    const result = await db
      .update(transcripts)
      .set(updateData)
      .where(eq(transcripts.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTranscript(id: number): Promise<boolean> {
    const result = await db
      .delete(transcripts)
      .where(eq(transcripts.id, id))
      .returning({ id: transcripts.id });
    
    return result.length > 0;
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
