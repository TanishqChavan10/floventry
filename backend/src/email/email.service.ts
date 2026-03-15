import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { generateInviteEmailTemplate } from './templates/invite-email.template';

export interface SendInviteEmailParams {
  to: string;
  companyName: string;
  invitedByName: string;
  role: string;
  invitationLink: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend?: Resend;
  private fromEmail?: string;

  constructor() {
    this.initializeResendClient();
  }

  private initializeResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.RESEND_FROM ||
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER;

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set. Email sending will be disabled.',
      );
      return;
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = from;

    if (!this.fromEmail) {
      this.logger.warn(
        'Email FROM address is not set (RESEND_FROM / EMAIL_FROM). Email sending will be disabled.',
      );
      return;
    }

    this.logger.log('Email service configured (provider=Resend)');
  }

  /**
   * Send a generic email (plain text or HTML)
   */
  async sendEmail(
    to: string,
    subject: string,
    text?: string,
    html?: string,
  ): Promise<void> {
    if (!this.resend || !this.fromEmail) {
      this.logger.warn('Email provider not configured. Skipping email send.');
      return;
    }

    if (!text && !html) {
      this.logger.warn(
        `Email content missing (no text/html). Skipping email send to ${to}.`,
      );
      return;
    }

    const base = {
      from: this.fromEmail,
      to,
      subject,
    };

    const payload = html
      ? text
        ? ({ ...base, html, text } satisfies Parameters<
            Resend['emails']['send']
          >[0])
        : ({ ...base, html } satisfies Parameters<Resend['emails']['send']>[0])
      : ({ ...base, text: text! } satisfies Parameters<
          Resend['emails']['send']
        >[0]);

    try {
      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        this.logger.error(
          `Resend rejected the email to ${to}: ${error.message}`,
          error,
        );
        throw new Error(error.message);
      }

      this.logger.log(
        `Email sent successfully to ${to}.${data?.id ? ` ResendId: ${data.id}` : ''}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send an invitation email to join a company
   */
  async sendInviteEmail(params: SendInviteEmailParams): Promise<void> {
    const { to, companyName, invitedByName, role, invitationLink } = params;

    const subject = `You've been invited to join ${companyName} on Flowventory`;

    // Generate HTML template
    const html = generateInviteEmailTemplate({
      companyName,
      invitedEmail: to,
      invitedByName,
      role,
      invitationLink,
    });

    // Plain text fallback
    const text = `
Hello,

${invitedByName} has invited you to join ${companyName} as ${role} on Flowventory.

Click the link below to accept the invitation:
${invitationLink}

This invitation will expire in 48 hours.

If you don't recognize this invitation, you can safely ignore this email.

Best regards,
The Flowventory Team
    `.trim();

    await this.sendEmail(to, subject, text, html);
  }
}
