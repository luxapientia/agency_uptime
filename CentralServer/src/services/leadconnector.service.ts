import { PrismaClient, NotificationType } from '@prisma/client';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import { config } from '../config';
import axios from 'axios';

export class LeadConnectorService {
    
    async createGoHighLevelContact(email: string) {
        try {
            const response = await axios.post(
                `${config.goHighLevel.baseUrl}/contacts/`,
                {
                    email
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.goHighLevel.locationApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status !== 200) {
                logger.error('Failed to create contact in GoHighLevel:', response.data);
                throw new Error('Failed to create contact in GoHighLevel');
            }

            return response.data;
        } catch (error) {
            logger.error('Error creating contact in GoHighLevel:', error);
            throw new Error('Failed to create contact in GoHighLevel');
        }
    }

    async sendPushNotification(email: string, title: string, message: string) {
        try {
            const response = await axios.post(
                config.goHighLevel.webhookUrl,
                {
                    contact: {
                        email
                    },
                    title,
                    message
                }
            );

            if (response.status !== 200) {
                logger.error('Failed to send push notification in GoHighLevel:', response.data);
                throw new Error('Failed to send push notification in GoHighLevel');
            }

            return true;
        } catch (error) {
            logger.error('Error sending push notification in GoHighLevel:', error);
            throw new Error('Failed to send push notification in GoHighLevel');
        }
    }
}

export const leadConnectorService = new LeadConnectorService();
