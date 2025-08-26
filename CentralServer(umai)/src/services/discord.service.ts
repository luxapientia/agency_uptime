import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import logger from '../utils/logger';
import { config } from '../config';

class DiscordService {
    private client: Client | null = null;
    public inviteLink: string = '';

    constructor() {
        try {
            if (!config.discord?.botToken) {
                logger.warn('Discord bot token not configured');
                return;
            }

            this.client = new Client({ 
                intents: [
                    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
                    GatewayIntentBits.GuildInvites,
                    GatewayIntentBits.GuildVoiceStates,
                    GatewayIntentBits.GuildPresences,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.GuildMembers,
                ] });

            // Set up event handlers
            this.setupEventHandlers();

            logger.info('Discord service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Discord service:', error);
            this.client = null;
        }
    }

    /**
     * Start the Discord bot
     */
    async start(): Promise<void> {
        if (!this.client) {
            logger.warn('Discord client not initialized');
            return;
        }

        try {
            await this.client.login(config.discord?.botToken);
            logger.info('Discord bot logged in successfully');
        } catch (error) {
            logger.error('Failed to log in Discord bot:', error);
            throw new Error('Failed to start Discord bot');
        }
    }

    private setupEventHandlers(): void {
        if (!this.client) return;

        this.client.on('guildMemberAdd', async (member) => {
            console.log(`🎉 New user joined: ${member.user.username} - ${member.user.id}`);
            await this.sendDirectMessage(member.user.id, `Welcome to the server! 🎉\n\n. Your userid is ${member.user.id}. Please register your userid to get notified when your website is down.`);
        });

        this.client.on('ready', async () => {
            const guild = await this.client?.guilds.fetch(config.discord?.serverId || ''); // Replace with your server ID
            const channel = guild?.channels.cache.find((ch: any) => ch.type === 0); // Finds a text channel

            if (channel) {
                const invite = await (channel as TextChannel).createInvite({
                    maxAge: 0, // 0 = Never expires
                    maxUses: 0 // 0 = Unlimited uses
                });

                console.log(`✅ Invite Link: ${invite.url}`);
                this.inviteLink = invite.url;
            }
        });
    }

    async verifyChannelId(userId: string): Promise<boolean> {

        if (!this.client) {
            logger.warn('Discord client not initialized');
            return false;
        }

        const user = await this.client.users.fetch(userId);
        if (!user) {
            return false;
        }

        return true;
    }

    /**
     * Send a direct message to a specific user
     */
    async sendDirectMessage(userId: string, message: string): Promise<void> {
        if (!this.client) {
            logger.warn('Discord client not initialized');
            return;
        }

        try {
            const user = await this.client.users.fetch(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            try {
                const dm = await user.createDM();
                await dm.send(message);
                logger.info(`Message sent successfully to Discord user: ${userId}`);
            } catch (error: any) {
                if (error?.code === 50007) {
                    throw new Error(
                        'Cannot send messages to this user. Make sure:\n' +
                        '1. The user has enabled DMs from server members\n' +
                        '2. The bot and user share at least one mutual server\n' +
                        '3. The user has not blocked the bot'
                    );
                }
                throw error;
            }
        } catch (error) {
            logger.error(`Failed to send Discord message to user ${userId}:`, error);
        }
    }

    /**
     * Send a file to a specific user
     */
    async sendFile(userId: string, file: string | Buffer, filename?: string): Promise<void> {
        if (!this.client) {
            logger.warn('Discord client not initialized');
            return;
        }

        try {
            const user = await this.client.users.fetch(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            try {
                const dm = await user.createDM();
                await dm.send({ files: [{ attachment: file, name: filename }] });
                logger.info(`File sent successfully to Discord user: ${userId}`);
            } catch (error: any) {
                if (error?.code === 50007) {
                    throw new Error(
                        'Cannot send files to this user. Make sure:\n' +
                        '1. The user has enabled DMs from server members\n' +
                        '2. The bot and user share at least one mutual server\n' +
                        '3. The user has not blocked the bot'
                    );
                }
                throw error;
            }
        } catch (error) {
            logger.error(`Failed to send file to Discord user ${userId}:`, error);
            throw new Error(error instanceof Error ? error.message : 'Failed to send Discord file');
        }
    }
}

// Export as singleton
export default new DiscordService();