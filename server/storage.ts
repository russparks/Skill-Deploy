import {
  type TrainingUser, type InsertTrainingUser,
  type TrainingSection, type InsertTrainingSection,
  type UserProgress, type InsertUserProgress,
  type Certificate, type InsertCertificate,
  trainingUsers, trainingSections, userProgress, certificates,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, lt, and } from "drizzle-orm";

export interface IStorage {
  createTrainingUser(user: InsertTrainingUser): Promise<TrainingUser>;
  getTrainingUser(id: number): Promise<TrainingUser | undefined>;
  getTrainingUserByEmail(email: string): Promise<TrainingUser | undefined>;
  getAllTrainingUsers(): Promise<TrainingUser[]>;
  deleteTrainingUser(id: number): Promise<void>;
  reactivateTrainingUser(id: number, data: { name: string; organization: string | null; scheduledDeletionAt: Date }): Promise<TrainingUser>;
  getExpiredUsers(): Promise<TrainingUser[]>;

  createTrainingSection(section: InsertTrainingSection): Promise<TrainingSection>;
  getTrainingSection(id: number): Promise<TrainingSection | undefined>;
  getAllTrainingSections(): Promise<TrainingSection[]>;
  updateTrainingSection(id: number, section: Partial<InsertTrainingSection>): Promise<TrainingSection | undefined>;
  deleteTrainingSection(id: number): Promise<void>;
  getTrainingSectionCount(): Promise<number>;

  getUserProgress(userId: number): Promise<UserProgress[]>;
  getProgressByUserAndSection(userId: number, sectionId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, data: Partial<UserProgress>): Promise<UserProgress | undefined>;
  deleteUserProgressByUser(userId: number): Promise<void>;

  createCertificate(cert: InsertCertificate): Promise<Certificate>;
  getCertificatesByUser(userId: number): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  updateCertificate(id: number, data: Partial<Certificate>): Promise<Certificate | undefined>;
  deleteCertificatesByUser(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createTrainingUser(user: InsertTrainingUser): Promise<TrainingUser> {
    const [result] = await db.insert(trainingUsers).values(user).returning();
    return result;
  }

  async getTrainingUser(id: number): Promise<TrainingUser | undefined> {
    const [result] = await db.select().from(trainingUsers).where(eq(trainingUsers.id, id));
    return result;
  }

  async getTrainingUserByEmail(email: string): Promise<TrainingUser | undefined> {
    const [result] = await db.select().from(trainingUsers).where(eq(trainingUsers.email, email));
    return result;
  }

  async getAllTrainingUsers(): Promise<TrainingUser[]> {
    return db.select().from(trainingUsers).where(eq(trainingUsers.isDeleted, false));
  }

  async deleteTrainingUser(id: number): Promise<void> {
    await db.update(trainingUsers).set({ isDeleted: true }).where(eq(trainingUsers.id, id));
  }

  async reactivateTrainingUser(id: number, data: { name: string; organization: string | null; scheduledDeletionAt: Date }): Promise<TrainingUser> {
    const [result] = await db.update(trainingUsers).set({
      name: data.name,
      organization: data.organization,
      scheduledDeletionAt: data.scheduledDeletionAt,
      isDeleted: false,
    }).where(eq(trainingUsers.id, id)).returning();
    return result;
  }

  async getExpiredUsers(): Promise<TrainingUser[]> {
    return db.select().from(trainingUsers).where(
      and(
        lt(trainingUsers.scheduledDeletionAt, new Date()),
        eq(trainingUsers.isDeleted, false)
      )
    );
  }

  async createTrainingSection(section: InsertTrainingSection): Promise<TrainingSection> {
    const [result] = await db.insert(trainingSections).values(section).returning();
    return result;
  }

  async getTrainingSection(id: number): Promise<TrainingSection | undefined> {
    const [result] = await db.select().from(trainingSections).where(eq(trainingSections.id, id));
    return result;
  }

  async getAllTrainingSections(): Promise<TrainingSection[]> {
    return db.select().from(trainingSections).orderBy(asc(trainingSections.orderIndex));
  }

  async updateTrainingSection(id: number, section: Partial<InsertTrainingSection>): Promise<TrainingSection | undefined> {
    const [result] = await db.update(trainingSections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(trainingSections.id, id))
      .returning();
    return result;
  }

  async deleteTrainingSection(id: number): Promise<void> {
    await db.delete(trainingSections).where(eq(trainingSections.id, id));
  }

  async getTrainingSectionCount(): Promise<number> {
    const results = await db.select().from(trainingSections);
    return results.length;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getProgressByUserAndSection(userId: number, sectionId: number): Promise<UserProgress | undefined> {
    const [result] = await db.select().from(userProgress).where(
      and(eq(userProgress.userId, userId), eq(userProgress.sectionId, sectionId))
    );
    return result;
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [result] = await db.insert(userProgress).values(progress).returning();
    return result;
  }

  async updateUserProgress(id: number, data: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const [result] = await db.update(userProgress).set(data).where(eq(userProgress.id, id)).returning();
    return result;
  }

  async deleteUserProgressByUser(userId: number): Promise<void> {
    await db.delete(userProgress).where(eq(userProgress.userId, userId));
  }

  async createCertificate(cert: InsertCertificate): Promise<Certificate> {
    const [result] = await db.insert(certificates).values(cert).returning();
    return result;
  }

  async getCertificatesByUser(userId: number): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.userId, userId));
  }

  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [result] = await db.select().from(certificates).where(eq(certificates.id, id));
    return result;
  }

  async updateCertificate(id: number, data: Partial<Certificate>): Promise<Certificate | undefined> {
    const [result] = await db.update(certificates).set(data).where(eq(certificates.id, id)).returning();
    return result;
  }

  async deleteCertificatesByUser(userId: number): Promise<void> {
    await db.delete(certificates).where(eq(certificates.userId, userId));
  }
}

export const storage = new DatabaseStorage();
