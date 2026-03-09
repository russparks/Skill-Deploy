# Quick Skill - Onboarding The Works

## Overview
A privacy-focused training platform where trainees register (name, email, organisation — all mandatory), complete modular training sections grouped by subject, answer true/false quiz questions per module, receive PDF certificates, and get a unique reference code (xxx-xxx-x format) on completion. Data auto-deletes after 24 hours.

## Architecture

### Frontend (client/)
- React + TypeScript with Wouter for routing
- Tailwind CSS with Shadcn UI components
- TanStack Query for data fetching

### Backend (server/)
- Express.js with TypeScript
- PostgreSQL via Drizzle ORM
- PDFKit for certificate generation
- Resend for email delivery (console fallback when unconfigured)
- node-cron for scheduled data cleanup (daily at midnight)

### Database Schema (shared/schema.ts)
- `trainingSubjects` - Subject groupings (e.g. Data Management, Quality & Compliance) with title, description, icon, orderIndex
- `trainingSections` - Training modules with content, videoUrl, estimatedMinutes, subjectId FK
- `sectionQuestions` - True/false quiz questions per section (questionText, correctAnswer boolean, orderIndex)
- `trainingUsers` - Temporary user storage with 24-hour scheduled deletion
- `userProgress` - Tracks section completion per user
- `certificates` - Records of generated certificates

### Auth (server/replit_integrations/auth/)
- Replit Auth for admin panel authentication

### Key Design Decisions
- **Privacy-first**: User data (email, name, organisation) stored temporarily, auto-deleted after 24 hours
- **No permanent accounts for trainees**: Session-based flow only
- **Soft-delete pattern**: Users marked `isDeleted=true`, then cleaned up by cron
- **Re-registration**: Returning completed users get a fresh start (progress/certificates cleared, referenceCode reset)
- **Subject grouping**: Modules grouped under subjects (Data Management + Quality & Compliance)
- **Quiz gate**: Each module has 2 true/false questions that must be answered correctly before marking complete
- **Block-based content editor**: Admin creates content with Header/Text/Image/Video blocks, serialized to HTML

## Routes
- `/` - Registration page (name, email, organisation — all mandatory, with privacy consent checkbox)
- `/dashboard/:userId` - Training dashboard with expandable subject cards and progress tracking
- `/training/:userId/:sectionId` - Training content viewer with embedded quiz
- `/certificates/:userId` - View earned certificates
- `/complete/:userId` - Completion page with unique reference code (xxx-xxx-x format)
- `/admin` - Admin panel (subjects, modules, questions, users, cleanup)

## API Endpoints
- `POST /api/users/register` - Register/reactivate user (organisation mandatory)
- `GET /api/users/:id` - Get user info
- `GET /api/users/:id/deletion-status` - Get hours remaining before data deletion
- `POST /api/users/:id/complete` - Generate reference code on completion
- `GET /api/users/reference/:code` - Look up a reference code
- `GET /api/subjects` - List training subjects
- `POST /api/subjects` - Create subject (admin)
- `PUT /api/subjects/:id` - Update subject (admin)
- `DELETE /api/subjects/:id` - Delete subject (admin)
- `GET /api/sections` - List training sections
- `GET /api/sections/:id` - Get single section
- `POST /api/sections` - Create section (admin)
- `PUT /api/sections/:id` - Update section (admin)
- `DELETE /api/sections/:id` - Delete section (admin)
- `GET /api/sections/:id/questions` - Get questions for a section
- `POST /api/sections/:id/questions` - Create question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress/complete` - Mark section complete
- `POST /api/progress/generate-certificate` - Generate PDF certificate
- `GET /api/training-material/download` - Download all training content as PDF
- `GET /api/certificates/download-all/:userId` - Download all certificates as merged PDF
- `GET /api/admin/users` - List all users (admin)
- `DELETE /api/users/:id/data` - Delete user data
- `POST /api/cleanup/run` - Manual cleanup trigger

## Email
- Powered by Resend (resend.com) via the `resend` npm package
- API key stored in `RESEND_API_KEY` secret
- From address: `noreply@axislabs.co.uk` (set via `EMAIL_FROM` env var, domain verified)
- Admin notification: sends email to `info@axislabs.co.uk` when a trainee completes all modules
- Falls back to console logging when `RESEND_API_KEY` is not set

## Services
- `server/services/certificateGenerator.ts` - PDF certificate generation
- `server/services/emailService.ts` - Email delivery with Resend + admin notification
- `server/services/dataCleanup.ts` - Scheduled data cleanup (daily at midnight, 24-hour retention)
- `server/init.ts` - Seeds 2 subjects, 8 sections (5 Data Management + 3 Quality & Compliance), and 2 questions per section

## Seed Data
- **Data Management** (5 modules): Privacy & Data Protection, Data Lifecycle Management, Privacy-Focused Design, Secure Data Deletion, Compliance and Best Practices
- **Quality and Compliance** (3 modules): Quality Management Systems, Regulatory Compliance Essentials, Continuous Improvement and Reporting
- Each module has 2 true/false quiz questions
