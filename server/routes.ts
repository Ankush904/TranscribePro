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

  // Upload audio file for transcription
  app.post("/api/transcribe/upload", upload.single("audio"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const api = req.body.api || "whisper";
      const model = req.body.model || (api === "whisper" ? "medium" : "nova-2");
      
      // Validate options
      const optionsValidation = transcriptionOptions.safeParse(JSON.parse(req.body.options || "{}"));
      if (!optionsValidation.success) {
        return res.status(400).json({ message: "Invalid options format" });
      }
      
      // Check if the requested model is valid
      const isValidModel = api === "whisper" 
        ? transcriptionAPIConfig.whisper.models.some(m => m.id === model)
        : transcriptionAPIConfig.deepgram.models.some(m => m.id === model);
        
      if (!isValidModel) {
        return res.status(400).json({ message: "Invalid transcription model" });
      }

      // Read file for API processing
      const audioFilePath = req.file.path;
      const audioBuffer = fs.readFileSync(audioFilePath);
      
      let transcriptionResult;
      
      if (api === "whisper") {
        // Use the API key from request if available, otherwise use the environment variable
        const OPENAI_API_KEY = req.body.openaiKey || process.env.OPENAI_API_KEY || "";
        
        if (!OPENAI_API_KEY) {
          return res.status(500).json({ 
            message: "OpenAI API key is missing. Please add your API key in Settings."
          });
        }
        
        try {
          // Create FormData object for the API request
          const FormData = require('form-data');
          const formData = new FormData();
          
          // Add the file to form data
          formData.append("file", audioBuffer, {
            filename: req.file.originalname || 'audio.wav',
            contentType: req.file.mimetype,
          });
          
          // Add model parameter
          formData.append("model", `whisper-${model}`);
          
          // Add language identification if needed
          formData.append("language", "en"); // Can be made dynamic in the future
          
          // If speaker diarization is enabled
          if (optionsValidation.data.speakerDiarization) {
            formData.append("speaker_detection", "true");
          }
          
          console.log(`Sending request to OpenAI Whisper API with model: whisper-${model}`);
          
          // Make the API request to OpenAI
          const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: formData,
          });
          
          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Process the response
          transcriptionResult = {
            text: result.text,
            duration: result.duration || 120, // Default if not provided
            wordCount: result.text.split(/\\s+/).length,
          };
          
          console.log("Whisper transcription successful");
        } catch (error) {
          console.error("Error with Whisper API:", error);
          
          // Fallback to mock data if in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log("Using mock data for Whisper API in development");
            transcriptionResult = {
              text: "This is a sample transcription. In a real implementation, this would be the actual transcribed text from the Whisper API.",
              duration: 120, // mock 2 minutes
              wordCount: 20,
            };
          } else {
            return res.status(500).json({ message: "Failed to transcribe with Whisper API" });
          }
        }
      } else {
        // Use the API key from request if available, otherwise use the environment variable
        const DEEPGRAM_API_KEY = req.body.deepgramKey || process.env.DEEPGRAM_API_KEY || "";
        
        if (!DEEPGRAM_API_KEY) {
          return res.status(500).json({ 
            message: "Deepgram API key is missing. Please add your API key in Settings."
          });
        }
        
        try {
          // Prepare the API options based on user selections
          const deepgramOptions = new URLSearchParams();
          deepgramOptions.append('model', model);
          
          if (optionsValidation.data.autoPunctuate) {
            deepgramOptions.append('punctuate', 'true');
          }
          
          if (optionsValidation.data.speakerDiarization) {
            deepgramOptions.append('diarize', 'true');
          }
          
          console.log(`Sending request to Deepgram API with model: ${model}`);
          
          // Make the API request to Deepgram
          const response = await fetch(`https://api.deepgram.com/v1/listen?${deepgramOptions.toString()}`, {
            method: "POST",
            headers: {
              "Authorization": `Token ${DEEPGRAM_API_KEY}`,
              "Content-Type": req.file.mimetype || "audio/wav"
            },
            body: audioBuffer
          });
          
          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Deepgram API error: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Process the response
          transcriptionResult = {
            text: result.results?.channels[0]?.alternatives[0]?.transcript || "",
            duration: result.metadata?.duration || 150,
            wordCount: result.results?.channels[0]?.alternatives[0]?.transcript.split(/\s+/).length || 0,
          };
          
          console.log("Deepgram transcription successful");
        } catch (error) {
          console.error("Error with Deepgram API:", error);
          
          // Fallback to mock data if in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log("Using mock data for Deepgram API in development");
            transcriptionResult = {
              text: "This is a sample transcription from Deepgram. In a real implementation, this would be the actual transcribed text from the Deepgram API.",
              duration: 150, // mock 2.5 minutes
              wordCount: 25,
            };
          } else {
            return res.status(500).json({ message: "Failed to transcribe with Deepgram API" });
          }
        }
      }
      
      // Clean up the temporary file
      fs.unlinkSync(audioFilePath);
      
      res.json({
        ...transcriptionResult,
        apiUsed: api,
        modelUsed: model,
        options: optionsValidation.data
      });
      
    } catch (error) {
      console.error("Error processing transcription:", error);
      res.status(500).json({ message: "Failed to process transcription" });
      
      // Clean up the temporary file if it exists
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    }
  });

  // Process Gemini analysis
  app.post("/api/gemini/analyze", async (req: Request, res: Response) => {
    try {
      const validationResult = geminiQuerySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const { transcript, question, config } = validationResult.data as GeminiQuery;
      // Use client-provided API key if available, otherwise use environment variable
      const GEMINI_API_KEY = req.body.geminiKey || process.env.GEMINI_API_KEY || "";
      
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ 
          message: "Gemini API key is missing. Please add your API key in Settings."
        });
      }
      
      // Format messages for Gemini API
      const system_content = "You are an AI assistant analyzing a transcript. Answer questions about the transcript content only based on the provided text. Keep your answers concise and relevant.";
      
      const formatted_messages = [
        {
          "parts": [
            {
              "text": "Here is a transcript:\n\n" + transcript + "\n\nQuestion: " + question
            }
          ]
        }
      ];
      
      // Prepare the API payload
      const api_payload = {
        "contents": formatted_messages,
        "system_instruction": {"parts": [{"text": system_content}]},
        "generationConfig": {
          "temperature": config.temperature,
          "topP": 0.9,
          "maxOutputTokens": config.maxTokens,
          "responseMimeType": "text/plain",
        },
      };
      
      // Call Gemini API
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(api_payload)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        
        // Extract the response text
        const responseText = result.candidates[0].content.parts[0].text;
        
        res.json({ response: responseText });
      } catch (error) {
        console.error("Error with Gemini API:", error);
        return res.status(500).json({ message: "Failed to analyze with Gemini API" });
      }
    } catch (error) {
      console.error("Error processing Gemini analysis:", error);
      res.status(500).json({ message: "Failed to process Gemini analysis" });
    }
  });

  return httpServer;
}
