import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { generateMonthlyReportHTML } from './monthlyReport.service';
import mailgunService from './mailgun.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class MonthlyReportCronService {
  private isInitialized = false;

  constructor() {
    // this.initializeCronJob();
  }

  public initializeCronJob() {
    if (this.isInitialized) return;

    // Schedule monthly report job to run on the 1st of every month at 9:00 AM UTC
    cron.schedule('0 9 1 * *', async () => {
      await this.sendMonthlyReports();
    }, {
      timezone: 'UTC'
    });

    this.isInitialized = true;
    logger.info('Monthly report cron job initialized');
  }

  /**
   * Send monthly reports for all users who have sites enabled for monthly reports
   */
  public async sendMonthlyReports(): Promise<void> {
    try {
      logger.info('Starting monthly report job');

      // Get the previous month
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const period = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

      logger.info(`Generating reports for period: ${period}`);

      // Get all users who have sites enabled for monthly reports
      const usersWithMonthlyReports = await prisma.user.findMany({
        where: {
          sites: {
            some: {
              isActive: true,
              monthlyReport: true
            }
          }
        },
        include: {
          sites: {
            where: {
              isActive: true,
              monthlyReport: true
            }
          }
        }
      });

      logger.info(`Found ${usersWithMonthlyReports.length} users with monthly reports enabled`);

      const results: Array<{ userId: string; success: boolean; error?: string }> = [];

      for (const user of usersWithMonthlyReports) {
        try {
          if (!user.email) {
            logger.warn(`User ${user.id} has no email address`);
            results.push({ userId: user.id, success: false, error: 'No email address' });
            continue;
          }

          // Generate the monthly report HTML
          const htmlContent = await generateMonthlyReportHTML(period, user.id);

          // Prepare email data
          const companyName = user.companyName || 'Your Company';
          const subject = `${companyName} - Monthly Report ${period}`;

          // Send email using existing mailgun service
          await mailgunService.sendEmail({
            to: user.email,
            subject,
            text: `Monthly Report for ${period} is attached. Please view in HTML format.`,
            html: htmlContent
          });

          logger.info(`Successfully sent monthly report to ${user.email} for period ${period}`);
          results.push({ userId: user.id, success: true });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Failed to send monthly report to user ${user.id}: ${errorMessage}`);
          results.push({ userId: user.id, success: false, error: errorMessage });
        }
      }

      // Log summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      logger.info(`Monthly report job completed. Success: ${successful}, Failed: ${failed}`);

      if (failed > 0) {
        logger.error('Failed reports:', results.filter(r => !r.success));
      }

    } catch (error) {
      logger.error('Monthly report job failed:', error);
    }
  }
}

export const monthlyReportCronService = new MonthlyReportCronService(); 