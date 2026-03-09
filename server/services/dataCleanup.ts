import cron from "node-cron";
import { storage } from "../storage";
import { log } from "../index";

export async function runCleanup(): Promise<{ deletedCount: number }> {
  log("Starting scheduled data cleanup...", "cleanup");
  const expiredUsers = await storage.getExpiredUsers();
  let deletedCount = 0;

  for (const user of expiredUsers) {
    try {
      await storage.deleteCertificatesByUser(user.id);
      await storage.deleteUserProgressByUser(user.id);
      await storage.deleteTrainingUser(user.id);
      deletedCount++;
      log(`Deleted data for user ${user.id} (${user.email})`, "cleanup");
    } catch (error) {
      log(`Failed to delete data for user ${user.id}: ${error}`, "cleanup");
    }
  }

  log(`Cleanup complete. Deleted ${deletedCount} expired user(s).`, "cleanup");
  return { deletedCount };
}

export function startCleanupCron() {
  cron.schedule("0 0 * * *", async () => {
    await runCleanup();
  });
  log("Data cleanup cron job scheduled (daily at midnight)", "cleanup");
}
