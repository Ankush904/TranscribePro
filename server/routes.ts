import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import fetch from "node-fetch";
import { 
  insertTranscriptSchema, 
  transcriptionAPIConfig,
  transcriptionOptions,
  geminiQuerySchema,
  type GeminiQuery
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Configure Python backend URL
const PYTHON_BACKEND_URL = "http://localhost:5001";

// Set up file upload with multer
const upload = multer({
  dest: path.join(os.tmpdir(), "transcript-uploads"),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all transcripts
  app.get("/api/transcripts", async (_req: Request, res: Response) => {
    try {
      const transcripts = await storage.getAllTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error("Error fetching transcripts:", error);
      res.status(500).json({ message: "Failed to fetch transcripts" });
    }
  });

  // Get a single transcript
  app.get("/api/transcripts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transcript ID" });
      }

      const transcript = await storage.getTranscript(id);
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      res.json(transcript);
    } catch (error) {
      console.error("Error fetching transcript:", error);
      res.status(500).json({ message: "Failed to fetch transcript" });
    }
  });

  // Create a new transcript
  app.post("/api/transcripts", async (req: Request, res: Response) => {
    try {
      const validationResult = insertTranscriptSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const transcript = await storage.createTranscript(validationResult.data);
      res.status(201).json(transcript);
    } catch (error) {
      console.error("Error creating transcript:", error);
      res.status(500).json({ message: "Failed to create transcript" });
    }
  });

  // Update a transcript
  app.patch("/api/transcripts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transcript ID" });
      }

      const transcript = await storage.getTranscript(id);
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      // Partial validation of update data
      const updateData = req.body;
      const updated = await storage.updateTranscript(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating transcript:", error);
      res.status(500).json({ message: "Failed to update transcript" });
    }
  });

  // Delete a transcript
  app.delete("/api/transcripts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transcript ID" });
      }

      const success = await storage.deleteTranscript(id);
      if (!success) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transcript:", error);
      res.status(500).json({ message: "Failed to delete transcript" });
    }
  });

  // Upload audio file for transcription - proxied to Python backend
  app.post("/api/transcribe/upload", upload.single("audio"), async (req: Request, res: Response) => {
    try {
      // Import proxy functionality 
      const { proxyToPython } = await import("./proxy");
      
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }
      
      // Forward the request to Python backend
      await proxyToPython(req, res, "/api/transcribe/upload");
      
    } catch (error) {
      console.error("Error processing transcription:", error);
      res.status(500).json({ message: "Failed to process transcription" });
      
      // Clean up the temporary file if it exists
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    }
  });

  // Process Gemini analysis - proxied to Python backend
  app.post("/api/gemini/analyze", async (req: Request, res: Response) => {
    try {
      // Validate request first
      const validationResult = geminiQuerySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Import proxy functionality
      const { proxyToPython } = await import("./proxy");
      
      // Forward the request to Python backend
      await proxyToPython(req, res, "/api/gemini/analyze");
      
    } catch (error) {
      console.error("Error processing Gemini analysis:", error);
      res.status(500).json({ message: "Failed to process Gemini analysis" });
    }
  });

  return httpServer;
}
