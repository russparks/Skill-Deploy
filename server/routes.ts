import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { generateCertificatePDF } from "./services/certificateGenerator";
import { sendCertificateEmail } from "./services/emailService";
import { runCleanup } from "./services/dataCleanup";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/users/register", async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().trim().toLowerCase().email(),
        organization: z.string().optional().nullable(),
      });
      const data = schema.parse(req.body);

      const trimmedEmail = data.email;
      const existing = await storage.getTrainingUserByEmail(trimmedEmail);

      if (existing && !existing.isDeleted) {
        return res.json(existing);
      }

      const scheduledDeletionAt = new Date();
      scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

      if (existing && existing.isDeleted) {
        const reactivated = await storage.reactivateTrainingUser(existing.id, {
          name: data.name,
          organization: data.organization || null,
          scheduledDeletionAt,
        });
        return res.json(reactivated);
      }

      const user = await storage.createTrainingUser({
        name: data.name,
        email: trimmedEmail,
        organization: data.organization || null,
        scheduledDeletionAt,
      });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

    const user = await storage.getTrainingUser(id);
    if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });

    res.json(user);
  });

  app.get("/api/users/:id/deletion-status", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

    const user = await storage.getTrainingUser(id);
    if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const deletionDate = new Date(user.scheduledDeletionAt);
    const msRemaining = deletionDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    res.json({
      scheduledDeletionAt: user.scheduledDeletionAt,
      daysRemaining,
      createdAt: user.createdAt,
    });
  });

  app.get("/api/sections", async (_req, res) => {
    const sections = await storage.getAllTrainingSections();
    res.json(sections);
  });

  app.get("/api/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid section ID" });

    const section = await storage.getTrainingSection(id);
    if (!section) return res.status(404).json({ message: "Section not found" });

    res.json(section);
  });

  app.post("/api/sections", async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        content: z.string().min(1),
        orderIndex: z.number().int(),
        videoUrl: z.string().optional().nullable(),
        estimatedMinutes: z.number().int().optional(),
      });
      const data = schema.parse(req.body);
      const section = await storage.createTrainingSection(data);
      res.status(201).json(section);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid section ID" });

    try {
      const schema = z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        content: z.string().min(1).optional(),
        orderIndex: z.number().int().optional(),
        videoUrl: z.string().optional().nullable(),
        estimatedMinutes: z.number().int().optional(),
      });
      const data = schema.parse(req.body);
      const section = await storage.updateTrainingSection(id, data);
      if (!section) return res.status(404).json({ message: "Section not found" });
      res.json(section);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid section ID" });

    await storage.deleteTrainingSection(id);
    res.json({ message: "Section deleted" });
  });

  app.get("/api/progress/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const progress = await storage.getUserProgress(userId);
    res.json(progress);
  });

  app.post("/api/progress/complete", async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number().int(),
        sectionId: z.number().int(),
      });
      const { userId, sectionId } = schema.parse(req.body);

      const user = await storage.getTrainingUser(userId);
      if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });

      const section = await storage.getTrainingSection(sectionId);
      if (!section) return res.status(404).json({ message: "Section not found" });

      let progress = await storage.getProgressByUserAndSection(userId, sectionId);

      if (progress) {
        if (!progress.completedAt) {
          progress = await storage.updateUserProgress(progress.id, {
            completedAt: new Date(),
          }) || progress;
        }
      } else {
        progress = await storage.createUserProgress({
          userId,
          sectionId,
          completedAt: new Date(),
        });
      }

      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/progress/generate-certificate", async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number().int(),
        sectionId: z.number().int(),
      });
      const { userId, sectionId } = schema.parse(req.body);

      const user = await storage.getTrainingUser(userId);
      if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });

      const section = await storage.getTrainingSection(sectionId);
      if (!section) return res.status(404).json({ message: "Section not found" });

      const progress = await storage.getProgressByUserAndSection(userId, sectionId);
      if (!progress || !progress.completedAt) {
        return res.status(400).json({ message: "Section not completed yet" });
      }

      const pdfBuffer = await generateCertificatePDF({
        userName: user.name,
        sectionTitle: section.title,
        completionDate: progress.completedAt,
        organization: user.organization,
      });

      const cert = await storage.createCertificate({
        userId,
        sectionId,
        certificateData: {
          userName: user.name,
          sectionTitle: section.title,
          completionDate: progress.completedAt.toISOString(),
          organization: user.organization,
        },
      });

      await storage.updateUserProgress(progress.id, { certificateGenerated: true });

      const emailSent = await sendCertificateEmail(
        user.email,
        user.name,
        section.title,
        pdfBuffer
      );

      if (emailSent) {
        await storage.updateCertificate(cert.id, { emailedAt: new Date() });
        await storage.updateUserProgress(progress.id, { certificateSent: true });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="certificate-${section.title.replace(/\s+/g, "-").toLowerCase()}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id/data", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

    const user = await storage.getTrainingUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await storage.deleteCertificatesByUser(id);
    await storage.deleteUserProgressByUser(id);
    await storage.deleteTrainingUser(id);

    res.json({ message: "User data deleted successfully" });
  });

  app.post("/api/cleanup/run", async (_req, res) => {
    const result = await runCleanup();
    res.json(result);
  });

  app.get("/api/admin/users", async (_req, res) => {
    const users = await storage.getAllTrainingUsers();
    res.json(users);
  });

  app.get("/api/certificates/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const certs = await storage.getCertificatesByUser(userId);
    res.json(certs);
  });

  return httpServer;
}
