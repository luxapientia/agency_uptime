import mailgunService from "./mailgun.service";
import slackService from "./slack.service";
import discordService from "./discord.service";
import telegramService from "./telegram.service";
import prisma from "../lib/prisma";
import { leadConnectorService } from "./leadconnector.service";
import axios from "axios";
import socketService from "./socket.service";

class NotificationService {

  constructor() {
  }

  async sendNotification(siteId: string, message: string, type: string) {
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

      const notificationSettings = await prisma.notificationSettings.findMany({
        where: {
          siteId,
        },
      });

      const notification = await prisma.notification.create({
        data: {
          userId: site.userId,
          message: message,
          type: type,
        }
      });

      socketService.sendToUser(site.userId, 'notification', {notificationId: notification.id, message: message, type: type});
      

      for (const notificationSetting of notificationSettings) {
        if (notificationSetting.type === 'EMAIL' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await mailgunService.sendEmail({
            to: notificationSetting.contactInfo as string,
            subject: `Your site ${site.name} is ${siteStatus.isUp ? 'up' : 'down'}`,
            text: message,
            html: `<p>${message}</p>`,
          });
        } else if (notificationSetting.type === 'SLACK' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await slackService.sendMessageToUserByEmail(notificationSetting.contactInfo as string, message);
        } else if (notificationSetting.type === 'DISCORD' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await discordService.sendDirectMessage(notificationSetting.contactInfo as string, message);
        } else if (notificationSetting.type === 'TELEGRAM' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await telegramService.sendMessageToChat(notificationSetting.contactInfo as string, message);
        } else if (notificationSetting.type === 'PUSH_NOTIFICATION' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await leadConnectorService.sendPushNotification(notificationSetting.contactInfo as string, "Agency Uptime Notification", message);
        } else if (notificationSetting.type === 'WEB_HOOK' && notificationSetting.contactInfo && notificationSetting.enabled) {
          // await webhookService.sendWebhook(notificationSetting.contactInfo as string, message);
          await axios.post(notificationSetting.contactInfo as string, {
            message: message,
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default new NotificationService();

