import TelegramBot from 'node-telegram-bot-api';
import logger from '../utils/logger';
import { config } from '../config';
import prisma from '../lib/prisma';

class TelegramService {
    private bot: TelegramBot | null = null;

    constructor() {
        try {
            // Initialize the bot with token from config
            if (!config.telegram?.botToken) {
                logger.warn('Telegram bot token not configured');
                return;
            }

            this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
            
            logger.info('Telegram service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Telegram service:', error);
            this.bot = null;
        }
    }

    start() {
        this.setupMessageHandler();
    }

    private setupMessageHandler(): void {
        if (!this.bot) return;

        this.bot.on('message', async (msg) => {
            try {
                const chatId = msg.chat.id.toString();
                await this.saveChatInfo(chatId, msg.from);
                
                // Send welcome message
                if (msg.text?.toLowerCase() === '/start') {
                    await this.sendMessageToChat(chatId, `Welcome to Agency Uptime Bot! Your chat ID is ${chatId}. Register your chatId to get notified when your website is down.`);
                }
            } catch (error) {
                logger.error('Error handling message:', error);
            }
        });
    }

    /**
     * Save or update chat information in the database
     */
    private async saveChatInfo(
        chatId: string,
        from?: TelegramBot.User
    ): Promise<void> {
        try {

            await prisma.telegramChat.upsert({
                where: { chatId },
                update: {
                    username: from?.username,
                    firstName: from?.first_name,
                    lastName: from?.last_name,
                    updatedAt: new Date(),
                },
                create: {
                    chatId,
                    username: from?.username,
                    firstName: from?.first_name,
                    lastName: from?.last_name,
                },
            });

            logger.info(`Chat information saved for chat ID: ${chatId}`);
        } catch (error) {
            logger.error('Failed to save chat information:', error);
            throw new Error('Failed to save chat information');
        }
    }

    /**
     * Send a message to a specific chat ID
     */
    async sendMessageToChat(
        chatId: string,
        message: string,
        options?: TelegramBot.SendMessageOptions
    ): Promise<void> {
        if (!this.bot) {
            logger.warn('Telegram bot not initialized');
            return;
        }

        try {
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                ...options
            });
            logger.info(`Message sent successfully to chat ID: ${chatId}`);
        } catch (error) {
            logger.error(`Failed to send Telegram message to chat ${chatId}:`, error);
            throw new Error('Failed to send Telegram message');
        }
    }

    /**
     * Send a photo to a specific chat ID
     */
    async sendPhotoToChat(
        chatId: string,
        photo: string | Buffer,
        caption?: string,
        options?: TelegramBot.SendPhotoOptions
    ): Promise<void> {
        if (!this.bot) {
            logger.warn('Telegram bot not initialized');
            return;
        }

        try {
            await this.bot.sendPhoto(chatId, photo, {
                caption,
                parse_mode: 'HTML',
                ...options
            });
            logger.info(`Photo sent successfully to chat ID: ${chatId}`);
        } catch (error) {
            logger.error(`Failed to send Telegram photo to chat ${chatId}:`, error);
            throw new Error('Failed to send Telegram photo');
        }
    }
}

// Export as singleton
export default new TelegramService();
