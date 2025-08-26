import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { config } from '../config';
import redisService from './redis.service';

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

class MailgunService {
  private readonly client: ReturnType<Mailgun['client']>;
  private readonly VERIFICATION_CODE_PREFIX = 'email:verification:';
  private readonly VERIFICATION_CODE_EXPIRY = 600; // 10 minutes in seconds

  constructor() {
    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: 'api',
      key: config.mailgun.apiKey,
      url: 'https://api.mailgun.net',
    });
  }

  /**
   * Generates a random verification code
   * @returns A 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Stores a verification code in Redis with expiration
   * @param email - The email address associated with the code
   * @param code - The verification code to store
   */
  private async storeVerificationCode(email: string, code: string): Promise<void> {
    const key = `${this.VERIFICATION_CODE_PREFIX}${email}`;
    await redisService.setValue(key, code, this.VERIFICATION_CODE_EXPIRY);
  }

  /**
   * Retrieves a stored verification code from Redis
   * @param email - The email address to get the code for
   * @returns The stored verification code or null if not found/expired
   */
  private async getStoredVerificationCode(email: string): Promise<string | null> {
    const key = `${this.VERIFICATION_CODE_PREFIX}${email}`;
    return await redisService.getValue(key);
  }

  /**
   * Sends a verification code to an email address
   * @param email - The email address to send the verification code to
   * @returns The verification code that was sent
   */
  async sendVerificationCode(email: string): Promise<string> {
    try {
      const verificationCode = this.generateVerificationCode();
      
      const emailData: EmailData = {
        to: email,
        subject: 'Email Verification Code',
        text: `Your verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
        html: `
          <h2>Email Verification</h2>
          <p>Your verification code is: <strong>${verificationCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification code, please ignore this email.</p>
        `
      };

      await this.client.messages.create(config.mailgun.domain, {
        from: `Agency Uptime <noreply@${config.mailgun.domain}>`,
        to: [email],
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      });

      // Store the verification code in Redis
      await this.storeVerificationCode(email, verificationCode);

      return verificationCode;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Verifies a code against the stored verification code for an email
   * @param email - The email address to verify
   * @param code - The verification code to check
   * @returns true if the code matches and hasn't expired, false otherwise
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const storedCode = await this.getStoredVerificationCode(email);

      console.log(storedCode, code, 'storedCode');
      
      if (!storedCode) {
        return false; // Code has expired or doesn't exist
      }

      const isValid = code === storedCode;
      
      if (isValid) {
        // Remove the code once verified successfully
        const key = `${this.VERIFICATION_CODE_PREFIX}${email}`;
        await redisService.deleteValue(key);
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying code:', error);
      throw new Error('Failed to verify code');
    }
  }

  /**
   * Sends a regular email using Mailgun
   * @param emailData - The email data containing recipient, subject, and content
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      await this.client.messages.create(config.mailgun.domain, {
        from: `Agency Uptime <noreply@${config.mailgun.domain}>`,
        to: [emailData.to],
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}

// Export a singleton instance
export default new MailgunService();