import mailgunService from "./mailgun.service";
import slackService from "./slack.service";
import discordService from "./discord.service";
import telegramService from "./telegram.service";
import prisma from "../lib/prisma";

class NotificationService {

  constructor() {
  }

  async sendNotification(siteId: string) {
    try {
      const site = await prisma.site.findUnique({
        where: {
          id: siteId,
        },
      });

      if (!site) {
        return;
      }

      const siteStatus = await prisma.siteStatus.findFirst({
        where: {
          siteId,
        },
        orderBy: {
          checkedAt: 'desc',
        },
      });

      if (!siteStatus) {
        return;
      }

      const message = `Your site ${site.name} (${site.url}) is ${siteStatus.isUp ? 'up' : 'down'} at ${siteStatus.checkedAt.toISOString()}`;

      const notifications = await prisma.notification.findMany({
        where: {
          siteId,
        },
      });

      for (const notification of notifications) {
        if (notification.type === 'EMAIL' && notification.contactInfo && notification.enabled) {
          await mailgunService.sendEmail({
            to: notification.contactInfo as string,
            subject: `Your site ${site.name} is ${siteStatus.isUp ? 'up' : 'down'}`,
            text: message,
            html: `<p>${message}</p>`,
          });
        } else if (notification.type === 'SLACK' && notification.contactInfo && notification.enabled) {
          await slackService.sendMessageToUserByEmail(notification.contactInfo as string, message);
        } else if (notification.type === 'DISCORD' && notification.contactInfo && notification.enabled) {
          await discordService.sendDirectMessage(notification.contactInfo as string, message);
        } else if (notification.type === 'TELEGRAM' && notification.contactInfo && notification.enabled) {
          await telegramService.sendMessageToChat(notification.contactInfo as string, message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default new NotificationService();

