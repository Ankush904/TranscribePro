import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Transcript schema
export const transcripts = pgTable("transcripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  audioFileName: text("audio_file_name"),
  duration: integer("duration").default(0), // in seconds
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  apiUsed: text("api_used").notNull(), // 'whisper' or 'deepgram'
  modelUsed: text("model_used").notNull(),
  options: jsonb("options").notNull()
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({
  id: true,
  createdAt: true,
});

export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;

// API configuration
export const transcriptionAPIConfig = {
  whisper: {
    models: [
      { id: "base", name: "Base (74MB) - Fastest" },
      { id: "small", name: "Small (244MB) - Good balance" },
      { id: "medium", name: "Medium (769MB) - Accurate" },
      { id: "large", name: "Large (1.5GB) - Most accurate" }
    ]
  },
  deepgram: {
    models: [
      { id: "nova-2", name: "Nova-2 (Most Accurate)" },
      { id: "enhanced", name: "Enhanced (Balanced)" },
      { id: "base", name: "Base (Fastest)" }
    ]
  }
};

export const transcriptionOptions = z.object({
  autoPunctuate: z.boolean().default(true),
  speakerDiarization: z.boolean().default(false),
  wordTimestamps: z.boolean().default(false)
});

export type TranscriptionOptions = z.infer<typeof transcriptionOptions>;

export const geminiConfig = z.object({
  temperature: z.number().min(0).max(1).default(0.2),
  maxTokens: z.number().min(100).max(2000).default(1000)
});

export type GeminiConfig = z.infer<typeof geminiConfig>;

export const geminiQuerySchema = z.object({
  transcript: z.string(),
  question: z.string(),
  config: geminiConfig
});

export type GeminiQuery = z.infer<typeof geminiQuerySchema>;
