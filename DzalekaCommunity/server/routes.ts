import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import multer from "multer";
import { setupAuth } from "./auth";
import { db } from "@db";
import { stories, comments, likes, notifications } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Stories
  app.get("/api/stories", async (req, res) => {
    const allStories = await db.query.stories.findMany({
      orderBy: desc(stories.createdAt),
    });
    res.json(allStories);
  });

  app.post("/api/stories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [story] = await db.insert(stories).values(req.body).returning();
    res.json(story);
  });

  // Comments
  app.get("/api/stories/:id/comments", async (req, res) => {
    const storyComments = await db.query.comments.findMany({
      where: eq(comments.storyId, parseInt(req.params.id)),
      orderBy: desc(comments.createdAt),
    });
    res.json(storyComments);
  });

  app.post("/api/stories/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [comment] = await db.insert(comments).values({
      ...req.body,
      storyId: parseInt(req.params.id),
    }).returning();

    // Create notification
    await db.insert(notifications).values({
      userId: req.body.userId,
      type: "comment",
      actorId: req.user!.id,
      storyId: parseInt(req.params.id),
    });

    res.json(comment);
  });

  // Likes
  app.get("/api/stories/:id/liked", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [like] = await db.select().from(likes).where(
      and(
        eq(likes.storyId, parseInt(req.params.id)),
        eq(likes.userId, req.user!.id)
      )
    );
    res.json(!!like);
  });

  app.post("/api/stories/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const storyId = parseInt(req.params.id);

    const [existing] = await db.select().from(likes).where(
      and(
        eq(likes.storyId, storyId),
        eq(likes.userId, req.user!.id)
      )
    );

    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      await db.update(stories)
        .set({ likes: stories.likes - 1 })
        .where(eq(stories.id, storyId));
    } else {
      await db.insert(likes).values({
        storyId,
        userId: req.user!.id,
      });
      await db.update(stories)
        .set({ likes: stories.likes + 1 })
        .where(eq(stories.id, storyId));

      // Create notification
      await db.insert(notifications).values({
        userId: req.user!.id,
        type: "like",
        actorId: req.user!.id,
        storyId,
      });
    }

    res.sendStatus(200);
  });

  // Users
  app.get("/api/users/:id", async (req, res) => {
    const [user] = await db.select().from(users).where(
      eq(users.id, parseInt(req.params.id))
    );
    res.json(user);
  });

  app.get("/api/users/:id/stories", async (req, res) => {
    const userStories = await db.select().from(stories).where(
      eq(stories.userId, parseInt(req.params.id))
    );
    res.json(userStories);
  });

  // Image upload
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).send("No file uploaded");

    // In a real app, upload to cloud storage
    // For demo, return a placeholder image
    res.json({
      url: "https://images.unsplash.com/photo-1487546331507-fcf8a5d27ab3",
    });
  });

  const httpServer = createServer(app);

  // WebSocket for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());
      if (data.type === "notification") {
        // Broadcast notification to all clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    });
  });

  return httpServer;
}
