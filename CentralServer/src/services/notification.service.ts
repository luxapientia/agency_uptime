import mailgunService from "./mailgun.service";
import slackService from "./slack.service";
import discordService from "./discord.service";
import telegramService from "./telegram.service";
import prisma from "../lib/prisma";
import { leadConnectorService } from "./leadconnector.service";
import { kimiPredictiveService } from "./kimiPredictive.service";
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

      // Get AI site health analysis
      let healthAnalysis = null;
      try {
        const analysis = await kimiPredictiveService.analyzeSiteHealth(siteId);
        healthAnalysis = {
          diagnosis: analysis.diagnosis,
          severity: analysis.severity,
          recommendations: analysis.recommendations?.slice(0, 3) || [], // Top 3 recommendations
          confidence: analysis.confidence
        };
      } catch (error) {
        console.error('Failed to get AI health analysis for notification:', error);
        // Continue without AI analysis if it fails
      }

      const notificationSettings = await prisma.notificationSettings.findMany({
        where: {
          siteId,
        },
      });

      // Enhanced message with health analysis
      let enhancedMessage = message;
      if (healthAnalysis) {
        enhancedMessage += `\n\n🏥 Site Health Analysis:\n`;
        enhancedMessage += `• Diagnosis: ${healthAnalysis.diagnosis}\n`;
        enhancedMessage += `• Severity: ${healthAnalysis.severity.toUpperCase()}\n`;
        enhancedMessage += `• Confidence: ${Math.round(healthAnalysis.confidence * 100)}%\n`;
        
        if (healthAnalysis.recommendations.length > 0) {
          enhancedMessage += `• Recommendations:\n`;
          healthAnalysis.recommendations.forEach((rec, index) => {
            enhancedMessage += `  ${index + 1}. ${rec}\n`;
          });
        }
      }

      const notification = await prisma.notification.create({
        data: {
          userId: site.userId,
          message: enhancedMessage,
          type: type,
        }
      });

      socketService.sendToUser(site.userId, 'notification', message);
      
      for (const notificationSetting of notificationSettings) {
        if (notificationSetting.type === 'EMAIL' && notificationSetting.contactInfo && notificationSetting.enabled) {
          // Enhanced email with health analysis
          let emailSubject = `Your site ${site.name} is ${siteStatus.isUp ? 'up' : 'down'}`;
          if (healthAnalysis && healthAnalysis.severity !== 'low') {
            emailSubject += ` - ${healthAnalysis.severity.toUpperCase()} health issue detected`;
          }

          let emailHtml = `<p>${message}</p>`;
          if (healthAnalysis) {
            const severityColor = {
              low: '#28a745',
              medium: '#ffc107', 
              high: '#fd7e14',
              critical: '#dc3545'
            }[healthAnalysis.severity] || '#6c757d';

            emailHtml += `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid ${severityColor};">
                <h3 style="margin-top: 0; color: ${severityColor};">🏥 Site Health Analysis</h3>
                <p><strong>Diagnosis:</strong> ${healthAnalysis.diagnosis}</p>
                <p><strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: bold;">${healthAnalysis.severity.toUpperCase()}</span></p>
                <p><strong>Confidence:</strong> ${Math.round(healthAnalysis.confidence * 100)}%</p>
                ${healthAnalysis.recommendations.length > 0 ? `
                  <p><strong>Recommendations:</strong></p>
                  <ul>
                    ${healthAnalysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `;
          }

          await mailgunService.sendEmail({
            to: notificationSetting.contactInfo as string,
            subject: emailSubject,
            text: enhancedMessage,
            html: emailHtml,
          });
        } else if (notificationSetting.type === 'SLACK' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await slackService.sendMessageToUserByEmail(notificationSetting.contactInfo as string, enhancedMessage);
        } else if (notificationSetting.type === 'DISCORD' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await discordService.sendDirectMessage(notificationSetting.contactInfo as string, enhancedMessage);
        } else if (notificationSetting.type === 'TELEGRAM' && notificationSetting.contactInfo && notificationSetting.enabled) {
          await telegramService.sendMessageToChat(notificationSetting.contactInfo as string, enhancedMessage);
        } else if (notificationSetting.type === 'PUSH_NOTIFICATION' && notificationSetting.contactInfo && notificationSetting.enabled) {
          let pushTitle = "Agency Uptime Notification";
          if (healthAnalysis && healthAnalysis.severity !== 'low') {
            pushTitle += ` - ${healthAnalysis.severity.toUpperCase()} health issue`;
          }
          await leadConnectorService.sendPushNotification(notificationSetting.contactInfo as string, pushTitle, enhancedMessage);
        } else if (notificationSetting.type === 'WEB_HOOK' && notificationSetting.contactInfo && notificationSetting.enabled) {
          // Enhanced webhook payload with health analysis
          const webhookPayload = {
            message: message,
            site: {
              id: site.id,
              name: site.name,
              url: site.url
            },
            status: {
              isUp: siteStatus.isUp,
              checkedAt: siteStatus.checkedAt
            },
            healthAnalysis: healthAnalysis
          };
          await axios.post(notificationSetting.contactInfo as string, webhookPayload);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default new NotificationService();

