// Email Service Abstraction
// Supports SMTP, Resend, SendGrid via environment configuration

import config from '../config/environment';
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const initTransporter = (): nodemailer.Transporter | null => {
  const provider = config.email.provider;

  if (provider === 'none' || !config.email.smtp.user) {
    console.log('Email service disabled');
    return null;
  }

  try {
    const options = {
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    };

    transporter = nodemailer.createTransport(options);

    return transporter;
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    return null;
  }
};

export const emailService = {
  async sendContactNotification(contact: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    if (!transporter) {
      transporter = initTransporter();
    }

    if (!transporter || !config.email.notifyTo) {
      console.log('Email notification skipped (not configured)');
      return false;
    }

    try {
      await transporter.sendMail({
        from: config.email.from,
        to: config.email.notifyTo,
        subject: `Portfolio Contact: ${contact.subject || 'No Subject'}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Subject:</strong> ${contact.subject || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <p>${contact.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>This message was submitted via the portfolio contact form.</p>
        `,
      });

      console.log('Contact notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send contact notification:', error);
      return false;
    }
  },

  async sendAdminNotification(subject: string, body: string): Promise<boolean> {
    if (!transporter) {
      transporter = initTransporter();
    }

    if (!transporter || !config.email.notifyTo) {
      return false;
    }

    try {
      await transporter.sendMail({
        from: config.email.from,
        to: config.email.notifyTo,
        subject,
        html: body,
      });
      return true;
    } catch {
      return false;
    }
  },

  isConfigured(): boolean {
    return config.email.provider !== 'none' && !!config.email.smtp.user;
  },
};
