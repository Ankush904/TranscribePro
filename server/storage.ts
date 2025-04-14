import { 
  transcripts, 
  type Transcript, 
  type InsertTranscript, 
  users, 
  type User, 
  type InsertUser 
} from "@shared/schema";

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

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transcripts: Map<number, Transcript>;
  private userCurrentId: number;
  private transcriptCurrentId: number;

  constructor() {
    this.users = new Map();
    this.transcripts = new Map();
    this.userCurrentId = 1;
    this.transcriptCurrentId = 1;
  }

  // User methods (kept from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Transcript methods
  async getAllTranscripts(): Promise<Transcript[]> {
    return Array.from(this.transcripts.values()).sort((a, b) => {
      // Sort by created date, newest first
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getTranscript(id: number): Promise<Transcript | undefined> {
    return this.transcripts.get(id);
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = this.transcriptCurrentId++;
    const now = new Date();
    const transcript: Transcript = {
      ...insertTranscript, 
      id,
      createdAt: now
    };
    this.transcripts.set(id, transcript);
    return transcript;
  }

  async updateTranscript(id: number, updateData: Partial<InsertTranscript>): Promise<Transcript | undefined> {
    const transcript = this.transcripts.get(id);
    if (!transcript) {
      return undefined;
    }
    
    const updatedTranscript: Transcript = {
      ...transcript,
      ...updateData,
    };
    
    this.transcripts.set(id, updatedTranscript);
    return updatedTranscript;
  }

  async deleteTranscript(id: number): Promise<boolean> {
    return this.transcripts.delete(id);
  }
}

// Export singleton instance
export const storage = new MemStorage();
