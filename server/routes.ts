import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMessage } from "./openai";
import { insertCardSchema } from "@shared/schema";
import { ZodError } from "zod";

export function registerRoutes(app: Express): Server {
  app.post("/api/cards", async (req, res) => {
    try {
      const cardData = insertCardSchema.parse(req.body);

      // Generate AI message if not provided
      if (!cardData.message) {
        cardData.message = await generateMessage({
          occasion: cardData.occasion,
          recipientName: cardData.recipientName,
          senderName: cardData.senderName,
          additionalContext: cardData.additionalContext || undefined,
        });
      }

      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error: any) {
      console.error("Error creating card:", {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid card data", errors: error.errors });
      } else {
        res.status(500).json({ 
          message: "Failed to create card", 
          error: error.message 
        });
      }
    }
  });

  app.get("/api/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const card = await storage.getCard(id);
      if (card) {
        res.json(card);
      } else {
        res.status(404).json({ message: "Card not found" });
      }
    } catch (error: any) {
      console.error("Error getting card:", error);
      res.status(500).json({ message: "Failed to get card", error: error.message });
    }
  });

  app.get("/api/cards", async (_req, res) => {
    try {
      const cards = await storage.listCards();
      res.json(cards);
    } catch (error: any) {
      console.error("Error listing cards:", error);
      res.status(500).json({ message: "Failed to list cards", error: error.message });
    }
  });

  app.post("/api/generate-message", async (req, res) => {
    try {
      console.log("Received generate-message request:", req.body);
      const { occasion, recipientName, senderName, additionalContext } = req.body;

      if (!occasion || !recipientName || !senderName) {
        return res.status(400).json({ 
          message: "Missing required fields: occasion, recipientName, and senderName are required" 
        });
      }

      const message = await generateMessage({
        occasion,
        recipientName,
        senderName,
        additionalContext,
      });

      res.json({ message });
    } catch (error: any) {
      console.error("Error generating message:", {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Add specific error handling for rate limits
      if (error.message.includes("rate") || error.message.includes("quota")) {
        res.status(429).json({
          message: "Message generation is temporarily unavailable. Please try again in a few moments.",
          error: error.message
        });
      } else {
        res.status(500).json({ 
          message: "Failed to generate message", 
          error: error.message 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}