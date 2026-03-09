# Privacy-Focused Training Platform

## Overview
A responsive training platform that collects temporary user data (email, company name), delivers section-based training content, sends PDF certificates after each section completion, generates a unique completion reference code, and automatically deletes user data after completion.

## Architecture

### Frontend (client/)
- React + TypeScript with Wouter for routing
- Tailwind CSS with Shadcn UI components
- TanStack Query for data fetching

### Backend (server/)
- Express.js with TypeScript
- PostgreSQL via Drizzle ORM for training sections and temporary user data
- PDFKit for certificate generation
- Nodemailer for email delivery (console fallback when unconfigured)
- node-cron for scheduled data cleanup

### Database Schema (shared/schema.ts)
- `trainingUsers` - Temporary user storage with scheduled deletion dates
- `trainingSections` - Admin-managed training content
- `userProgress` - Tracks section completion per user
- `certificates` - Records of generated certificates

### Auth (server/replit_integrations/auth/)
- Replit Auth for admin panel authentication
- Users table in `shared/models/auth.ts` for admin accounts

### Key Design Decisions
- **Privacy-first**: User data (email, company name) stored temporarily, deleted after completion or 30-day expiry
- **No permanent accounts for trainees**: Session-based flow only
- **Soft-delete pattern**: Users marked `isDeleted=true`, then cleaned up by cron
- **Re-registration**: Soft-deleted users are reactivated (not re-inserted) to avoid unique email constraint violations

## Routes
- `/` - Registration page (email, name, organization)
- `/dashboard/:userId` - Training dashboard with progress
- `/training/:userId/:sectionId` - Training content viewer
- `/certificates/:userId` - View earned certificates
- `/admin` - Admin panel (section CRUD, user management, cleanup)

## API Endpoints
- `POST /api/users/register` - Register/reactivate user
- `GET /api/users/:id` - Get user info
- `GET /api/sections` - List training sections
- `POST /api/progress/complete` - Mark section complete
- `POST /api/progress/generate-certificate` - Generate PDF certificate
- `DELETE /api/users/:id/data` - Delete user data
- `POST /api/cleanup/run` - Manual cleanup trigger

## Services
- `server/services/certificateGenerator.ts` - PDF certificate generation
- `server/services/emailService.ts` - Email delivery with Nodemailer
- `server/services/dataCleanup.ts` - Scheduled data cleanup (daily at midnight)
- `server/init.ts` - Seeds 5 sample training sections on first run
