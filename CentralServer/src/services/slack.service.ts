import { WebClient } from '@slack/web-api';
import logger from '../utils/logger';
import { config } from '../config';

class SlackService {
    private client: WebClient | null = null;

    constructor() {
        if (!config.slack?.botToken) {
            logger.warn('Slack bot token not configured');
            return;
        }
        this.client = new WebClient(config.slack.botToken);
        logger.info('Slack service initialized successfully');
    }

    async sendMessageToUserByEmail(email: string, message: string): Promise<void> {
        try {
            // Get user id by email
            const userResult = await this.client?.users.lookupByEmail({ email });
            if (!userResult?.user?.id) {
                logger.warn(`Slack user not found for email ${email}`);
                return;
            }
            
            //Open DM channel
            const dmResult = await this.client?.conversations.open({
                users: userResult.user.id
            });
            const channelId = dmResult?.channel?.id;
            if (!channelId) {
                logger.warn(`Failed to open DM channel for user ${userResult.user.id}`);
                return;
            }

            // Send message
            await this.client?.chat.postMessage({
                channel: channelId,
                text: message
            });
            logger.info(`Sent message to Slack user ${email}: ${message}`);
        } catch (error) {
            logger.error(`Failed to send message to Slack user ${email}:`, error);
        }
    }

    async verifyUser(email: string): Promise<boolean> {
        try {
            const userResult = await this.client?.users.lookupByEmail({ email });
            return userResult?.user?.id !== undefined;
        } catch (error) {
            logger.error(`Failed to verify Slack user ${email}:`, error);
            return false;
        }
    }
}

export default new SlackService();
