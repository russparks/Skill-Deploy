import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const trainingUsers = pgTable("training_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  organization: text("organization"),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledDeletionAt: timestamp("scheduled_deletion_at").notNull(),
  isDeleted: boolean("is_deleted").default(false),
});

export const trainingSections = pgTable("training_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"),
  estimatedMinutes: integer("estimated_minutes").default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => trainingUsers.id),
  sectionId: integer("section_id").notNull().references(() => trainingSections.id),
  completedAt: timestamp("completed_at"),
  certificateGenerated: boolean("certificate_generated").default(false),
  certificateSent: boolean("certificate_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => trainingUsers.id),
  sectionId: integer("section_id").notNull().references(() => trainingSections.id),
  certificateData: json("certificate_data"),
  generatedAt: timestamp("generated_at").defaultNow(),
  emailedAt: timestamp("emailed_at"),
});

export const insertTrainingUserSchema = createInsertSchema(trainingUsers).omit({
  id: true,
  createdAt: true,
  isDeleted: true,
});

export const insertTrainingSectionSchema = createInsertSchema(trainingSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  certificateGenerated: true,
  certificateSent: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  generatedAt: true,
  emailedAt: true,
});

export type InsertTrainingUser = z.infer<typeof insertTrainingUserSchema>;
export type TrainingUser = typeof trainingUsers.$inferSelect;

export type InsertTrainingSection = z.infer<typeof insertTrainingSectionSchema>;
export type TrainingSection = typeof trainingSections.$inferSelect;

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;
