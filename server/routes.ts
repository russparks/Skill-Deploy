import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import crypto from "crypto";
import { generateCertificatePDF, generateTrainingMaterialPDF } from "./services/certificateGenerator";
import { sendCertificateEmail, sendCompletionEmail, sendAdminNotificationEmail } from "./services/emailService";
import { runCleanup } from "./services/dataCleanup";

function generateReferenceCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const part = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => chars[b % chars.length])
      .join("");
  return `${part(3)}-${part(3)}-${part(1)}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/users/register", async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().trim().toLowerCase().email(),
        organization: z.string().min(1, "Organisation is required"),
      });
      const data = schema.parse(req.body);

      const trimmedEmail = data.email;
      const existing = await storage.getTrainingUserByEmail(trimmedEmail);

      const scheduledDeletionAt = new Date();
      scheduledDeletionAt.setHours(scheduledDeletionAt.getHours() + 24);

      if (existing && !existing.isDeleted) {
        if (existing.referenceCode) {
          await storage.deleteCertificatesByUser(existing.id);
          await storage.deleteUserProgressByUser(existing.id);
          const reset = await storage.updateTrainingUser(existing.id, {
            name: data.name,
            organization: data.organization || null,
            referenceCode: null,
            completedAt: null,
            scheduledDeletionAt,
          });
          return res.json(reset);
        }
        return res.json(existing);
      }

      if (existing && existing.isDeleted) {
        await storage.deleteCertificatesByUser(existing.id);
        await storage.deleteUserProgressByUser(existing.id);
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
    const hoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));

    res.json({
      scheduledDeletionAt: user.scheduledDeletionAt,
      hoursRemaining,
      createdAt: user.createdAt,
    });
  });

  app.get("/api/subjects", async (_req, res) => {
    const subjects = await storage.getAllTrainingSubjects();
    res.json(subjects);
  });

  app.get("/api/subjects/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid subject ID" });
    const subject = await storage.getTrainingSubject(id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        icon: z.string().default("book"),
        orderIndex: z.number().int(),
      });
      const data = schema.parse(req.body);
      const subject = await storage.createTrainingSubject(data);
      res.status(201).json(subject);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/subjects/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid subject ID" });
    try {
      const schema = z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        icon: z.string().optional(),
        orderIndex: z.number().int().optional(),
      });
      const data = schema.parse(req.body);
      const subject = await storage.updateTrainingSubject(id, data);
      if (!subject) return res.status(404).json({ message: "Subject not found" });
      res.json(subject);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid subject ID" });
    await storage.deleteTrainingSubject(id);
    res.json({ message: "Subject deleted" });
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

  app.get("/api/sections/:id/questions", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid section ID" });
    const questions = await storage.getSectionQuestions(id);
    res.json(questions);
  });

  app.post("/api/sections", async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        content: z.string().min(1),
        orderIndex: z.number().int(),
        subjectId: z.number().int().optional().nullable(),
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
        subjectId: z.number().int().optional().nullable(),
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

  app.post("/api/sections/:id/questions", async (req, res) => {
    const sectionId = parseInt(req.params.id);
    if (isNaN(sectionId)) return res.status(400).json({ message: "Invalid section ID" });
    try {
      const schema = z.object({
        questionText: z.string().min(1),
        correctAnswer: z.boolean(),
        orderIndex: z.number().int(),
      });
      const data = schema.parse(req.body);
      const question = await storage.createSectionQuestion({ ...data, sectionId });
      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid question ID" });
    try {
      const schema = z.object({
        questionText: z.string().min(1).optional(),
        correctAnswer: z.boolean().optional(),
        orderIndex: z.number().int().optional(),
      });
      const data = schema.parse(req.body);
      const question = await storage.updateSectionQuestion(id, data);
      if (!question) return res.status(404).json({ message: "Question not found" });
      res.json(question);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid question ID" });
    await storage.deleteSectionQuestion(id);
    res.json({ message: "Question deleted" });
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

      const questions = await storage.getQuestionsBySection(sectionId);
      if (questions.length > 0) {
        const { quizAnswers } = req.body;
        if (!quizAnswers || typeof quizAnswers !== "object") {
          return res.status(400).json({ message: "Quiz answers are required for this section" });
        }
        for (const q of questions) {
          if (quizAnswers[q.id] !== q.correctAnswer) {
            return res.status(400).json({ message: "All quiz questions must be answered correctly" });
          }
        }
      }

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

  app.get("/api/training-material/download", async (_req, res) => {
    try {
      const sections = await storage.getAllTrainingSections();
      if (sections.length === 0) {
        return res.status(404).json({ message: "No training material available" });
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      const pdfBuffer = await generateTrainingMaterialPDF(sections);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="training-material.pdf"');
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/certificates/download-all/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

      const user = await storage.getTrainingUser(userId);
      if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });

      const sections = await storage.getAllTrainingSections();
      const progress = await storage.getUserProgress(userId);
      const completedProgress = progress.filter((p) => p.completedAt);

      if (completedProgress.length === 0) {
        return res.status(400).json({ message: "No completed sections" });
      }

      const { generateAllCertificatesPDF } = await import("./services/certificateGenerator");
      const certEntries = completedProgress
        .map((prog) => {
          const section = sections.find((s) => s.id === prog.sectionId);
          if (!section || !prog.completedAt) return null;
          return {
            userName: user.name,
            sectionTitle: section.title,
            completionDate: prog.completedAt,
            organization: user.organization,
          };
        })
        .filter(Boolean) as Array<{ userName: string; sectionTitle: string; completionDate: Date; organization: string | null }>;

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const pdfBuffer = await generateAllCertificatesPDF(certEntries);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="all-certificates.pdf"');
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

      const user = await storage.getTrainingUser(id);
      if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });

      if (user.referenceCode) {
        return res.json({ referenceCode: user.referenceCode, alreadyCompleted: true });
      }

      const sections = await storage.getAllTrainingSections();
      const progress = await storage.getUserProgress(id);
      const completedIds = new Set(progress.filter((p) => p.completedAt).map((p) => p.sectionId));
      const allComplete = sections.length > 0 && sections.every((s) => completedIds.has(s.id));

      if (!allComplete) {
        return res.status(400).json({ message: "Not all sections completed" });
      }

      let referenceCode = generateReferenceCode();
      let codeExists = await storage.getTrainingUserByReferenceCode(referenceCode);
      let attempts = 0;
      while (codeExists && attempts < 50) {
        referenceCode = generateReferenceCode();
        codeExists = await storage.getTrainingUserByReferenceCode(referenceCode);
        attempts++;
      }
      if (codeExists) {
        return res.status(500).json({ message: "Unable to generate unique reference code. Please try again." });
      }

      const updated = await storage.updateTrainingUser(id, {
        referenceCode,
        completedAt: new Date(),
      });

      try {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        await sendCompletionEmail(user.email, user.name, referenceCode, baseUrl, id);
      } catch (emailErr) {
      }

      try {
        await sendAdminNotificationEmail(user.name, referenceCode);
      } catch (adminEmailErr) {
      }

      res.json({ referenceCode: updated?.referenceCode, completedAt: updated?.completedAt });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/reference/:code", async (req, res) => {
    const user = await storage.getTrainingUserByReferenceCode(req.params.code.toLowerCase());
    if (!user) return res.status(404).json({ message: "Reference code not found" });
    res.json({ exists: true, name: user.name });
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
