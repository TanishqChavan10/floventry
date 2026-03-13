import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
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
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = parseInt(
      process.env.SMTP_PORT || process.env.EMAIL_PORT || '587',
      10,
    );
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const password = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    const forceIpv4 =
      (process.env.SMTP_FORCE_IPV4 || '').toLowerCase() === 'true';
    const requireTls =
      (process.env.SMTP_REQUIRE_TLS || '').toLowerCase() === 'true';

    const connectionTimeout = parseInt(
      process.env.SMTP_CONNECTION_TIMEOUT_MS || '20000',
      10,
    );
    const greetingTimeout = parseInt(
      process.env.SMTP_GREETING_TIMEOUT_MS || '20000',
      10,
    );
    const socketTimeout = parseInt(
      process.env.SMTP_SOCKET_TIMEOUT_MS || '30000',
      10,
    );

    if (!host || !user || !password) {
      this.logger.warn(
        'Email configuration is incomplete. Email sending will be disabled.',
      );
      return;
    }

    this.logger.log(
      `Configuring SMTP transport host=${host} port=${port} secure=${port === 465} forceIpv4=${forceIpv4} requireTls=${requireTls}`,
    );

    type SmtpOptionsWithFamily = SMTPTransport.Options & { family?: 4 | 6 };

    const transportOptions: SmtpOptionsWithFamily = {
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      family: forceIpv4 ? 4 : undefined,
      requireTLS: requireTls,
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
      tls: {
        // Helps some providers during TLS negotiation.
        servername: host,
      },
      auth: {
        user,
        pass: password,
      },
    };

    this.transporter = nodemailer.createTransport(transportOptions);

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          `Email transporter verification failed (host=${host} port=${port}):`,
          error,
        );
      } else {
        this.logger.log('Email service is ready to send messages');
      }
    });
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
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping email send.',
      );
      return;
    }

    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(
        `Email sent successfully to ${to}. MessageId: ${info.messageId}`,
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
