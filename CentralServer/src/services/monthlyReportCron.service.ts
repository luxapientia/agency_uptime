import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { generateSiteMonthlyReportHTML } from './siteMonthlyReport.service';
import mailgunService from './mailgun.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class MonthlyReportCronService {
  private isInitialized = false;
  private sentCache: Map<string, number> = new Map(); // key: siteId:period → lastSentMs

  constructor() {
    // this.initializeCronJob();
  }

  public initializeCronJob() {
    if (this.isInitialized) return;

    // Run every minute in UTC and check sites whose monthlyReportSendAt matches current UTC day/hour/minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.sendMonthlyReports();
      } catch (err) {
        logger.error('Monthly report cron tick failed:', err);
      }
    }, { timezone: 'UTC' });

    this.isInitialized = true;
    logger.info('Monthly report cron job initialized (every minute, UTC).');
  }

  /**
   * Send monthly reports for sites enabled for monthly reports when their scheduled UTC time matches
   */
  public async sendMonthlyReports(): Promise<void> {
    try {
      logger.info('Monthly report cron tick');

      const now = new Date();
      const nowUTC = new Date(now.toISOString()); // ensure UTC components usage
      const nowDay = nowUTC.getUTCDate();
      const nowHour = nowUTC.getUTCHours();
      const nowMinute = nowUTC.getUTCMinutes();

      // previous month period string
      const prevMonthDate = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth() - 1, 1));
      const period = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0')}`;

      // Find all active sites that opted-in for monthly report
      const sites = await prisma.site.findMany({
        where: { isActive: true, monthlyReport: true },
        include: { user: true },
      });

      let sendCount = 0;

      for (const site of sites) {
        try {
          // Determine if schedule matches current time
          let shouldSend = false;
          if (site.monthlyReportSendAt) {
            const sched = new Date(site.monthlyReportSendAt);
            const schedDay = sched.getUTCDate();
            const schedHour = sched.getUTCHours();
            const schedMinute = sched.getUTCMinutes();
            shouldSend = (schedDay === nowDay && schedHour === nowHour && schedMinute === nowMinute);
          } else {
            // Fallback: 1st day 09:00 UTC
            shouldSend = (nowDay === 1 && nowHour === 9 && nowMinute === 0);
          }

          if (!shouldSend) continue;

          // In-memory dedupe so we don't send multiple times in the same minute/process
          const cacheKey = `${site.id}:${period}`;
          const lastSentMs = this.sentCache.get(cacheKey) || 0;
          if (now.getTime() - lastSentMs < 60_000) {
            // already sent within the last minute
            continue;
          }

          if (!site.user?.email) {
            logger.warn(`Skipping site ${site.id} (${site.name}) - user has no email`);
            continue;
          }

          // Generate per-site monthly report HTML
          const htmlContent = await generateSiteMonthlyReportHTML(site.id);

          const companyName = site.user.companyName || 'Your Company';
          const subject = `${companyName} - ${site.name} - Monthly Report ${period}`;

          await mailgunService.sendEmail({
            to: site.user.email,
            subject,
            text: `Monthly Report for ${site.name} (${period}).`,
            html: htmlContent,
          });

          this.sentCache.set(cacheKey, now.getTime());
          sendCount += 1;
          logger.info(`Sent monthly report for site ${site.name} (${site.id}) to ${site.user.email} for period ${period}`);
        } catch (err) {
          logger.error(`Failed to send monthly report for site ${site.id}:`, err);
        }
      }

      logger.info(`Monthly report cron tick complete. Sent ${sendCount} reports for period ${period}.`);
    } catch (error) {
      logger.error('Monthly report job failed:', error);
    }
  }
}

export const monthlyReportCronService = new MonthlyReportCronService(); 