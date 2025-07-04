import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { config } from '../config';

const mailgun = new Mailgun(formData);

// Initialize the client with proper typing
const client = mailgun.client({
  username: 'api',
  key: config.mailgun.apiKey,
  url: 'https://api.mailgun.net', // Use EU endpoint if your domain is in EU region
});

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailData) {
  try {
    if (!config.mailgun.domain || !config.mailgun.apiKey) {
      throw new Error('Mailgun configuration is missing');
    }

    const messageData = {
      from: config.mailgun.fromEmail,
      to,
      subject,
      text,
      html,
    };

    const response = await client.messages.create(config.mailgun.domain, messageData);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error sending email:', error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }
    return { success: false, error };
  }
}