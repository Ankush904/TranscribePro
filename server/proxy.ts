import fetch from "node-fetch";
import { Request, Response } from "express";
import FormData from "form-data";
import { Readable } from "stream";

export const PYTHON_BACKEND_URL = "http://localhost:5001";

/**
 * Proxy middleware to forward requests to Python backend
 */
export async function proxyToPython(req: Request, res: Response, endpoint: string) {
  try {
    const url = `${PYTHON_BACKEND_URL}${endpoint}`;
    
    let proxyRes;
    
    if (req.method === "GET") {
      // Handle GET requests
      proxyRes = await fetch(url);
    } else if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") {
      const isFormData = req.headers["content-type"]?.includes("multipart/form-data");
      
      if (isFormData && req.file) {
        // Handle file uploads
        const formData = new FormData();
        
        // Add the file to form data
        formData.append("audio", req.file.buffer, {
          filename: req.file.originalname || 'audio.file',
          contentType: req.file.mimetype,
        });
        
        // Add other form fields
        Object.keys(req.body).forEach(key => {
          formData.append(key, req.body[key]);
        });
        
        proxyRes = await fetch(url, {
          method: req.method,
          body: formData,
          headers: formData.getHeaders()
        });
      } else {
        // Handle JSON requests
        proxyRes = await fetch(url, {
          method: req.method,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(req.body)
        });
      }
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
    
    // Get the response data
    const contentType = proxyRes.headers.get("content-type") || "";
    const status = proxyRes.status;
    
    // Set the status code
    res.status(status);
    
    // Copy headers
    proxyRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    if (contentType.includes("application/json")) {
      const data = await proxyRes.json();
      return res.json(data);
    } else {
      const data = await proxyRes.text();
      return res.send(data);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ message: "Failed to proxy request to Python backend" });
  }
}