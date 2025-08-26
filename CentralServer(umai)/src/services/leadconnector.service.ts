import logger from '../utils/logger';
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
            const user = await this.lookupGoHighLevelUser(email);
            if(!user.id) {
                logger.error('User not found in GoHighLevel:', email);
                throw new Error('User not found in GoHighLevel');
            }

            const response = await axios.post(
                config.goHighLevel.webhookUrl,
                {
                    contact: {
                        id: user.id,
                        name: user.name,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
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

    async lookupGoHighLevelUser(email: string) {
        try {
            const response = await axios.get(
                `${config.goHighLevel.baseUrl}/users/lookup?email=${email}`,
                {
                    headers: {
                        'Authorization': `Bearer ${config.goHighLevel.agencyApiKey}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Error getting GoHighLevel users:', error);
            throw new Error('Failed to get GoHighLevel users');
        }
    }
}

export const leadConnectorService = new LeadConnectorService();
