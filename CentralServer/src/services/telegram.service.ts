import TelegramBot from 'node-telegram-bot-api';
import logger from '../utils/logger';
import { config } from '../config';

class TelegramService {
    private bot: TelegramBot | null = null;
    private botUsername: string | null = null;

    constructor() {
        try {
            // Initialize the bot with token from config
            if (!config.telegram?.botToken) {
                logger.warn('Telegram bot token not configured');
                return;
            }

            this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
            
            // Get bot username on initialization
            this.bot.getMe().then(botInfo => {
                this.botUsername = botInfo.username || null;
                logger.info(`Telegram bot username: @${this.botUsername}`);
            }).catch(error => {
                logger.error('Failed to get bot username:', error);
                this.botUsername = null;
            });
            
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
     * Verify if the chatId is valid
     */
    async verifyChatId(chatId: string): Promise<boolean> {
        try {
            const chat = await this.bot?.getChat(chatId);
            return chat !== null;
        } catch (error) {
            logger.error('Error verifying chat ID:', error);
            return false;
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

    /**
     * Get the bot's username
     */
    async getBotUsername(): Promise<string> {
        if (this.botUsername) {
            return this.botUsername;
        }

        if (!this.bot) {
            throw new Error('Telegram bot not initialized');
        }

        try {
            const botInfo = await this.bot.getMe();
            this.botUsername = botInfo.username || 'AgencyUptimeBot';
            return this.botUsername;
        } catch (error) {
            logger.error('Failed to get bot username:', error);
            return 'AgencyUptimeBot'; // Fallback to default name
        }
    }
}

// Export as singleton
export default new TelegramService();
