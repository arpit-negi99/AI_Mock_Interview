import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { sendBrevoEmail } from './emailTransport.service.js';

let transporter;

function isSmtpConfigured() {
  return Boolean((env.smtp.host || env.smtp.service) && env.smtp.user && env.smtp.pass && env.smtp.from);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    throw new AppError('SMTP is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM to backend .env, then restart the backend.', 500);
  }

  if (!transporter) {
    const transportConfig = env.smtp.service
      ? { service: env.smtp.service }
      : {
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure || env.smtp.port === 465,
      };

    transporter = nodemailer.createTransport({
      ...transportConfig,
      connectionTimeout: env.emailTimeoutMs,
      greetingTimeout: env.emailTimeoutMs,
      socketTimeout: env.emailTimeoutMs,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  return transporter;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendOtpEmail({ to, name, otp, purpose, expiresInMinutes }) {
  const isPasswordReset = purpose === 'reset-password';
  const subject = isPasswordReset ? 'Reset your InterviewAI password' : 'Verify your InterviewAI account';
  const heading = isPasswordReset ? 'Reset your password' : 'Verify your account';
  const message = isPasswordReset
    ? 'Use this OTP to reset your password.'
    : 'Use this OTP to finish creating your account.';

  try {
    if (env.nodeEnv === 'test') {
      logger.info('Skipping OTP email in test environment', { to, purpose });
      return;
    }

    const email = {
      to,
      subject,
      text: `${message}\n\nOTP: ${otp}\nThis code expires in ${expiresInMinutes} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>${heading}</h2>
          <p>Hello ${escapeHtml(name || 'there')},</p>
          <p>${message}</p>
          <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
          <p>This code expires in ${expiresInMinutes} minutes.</p>
        </div>
      `,
    };
    if (env.emailProvider === 'brevo') {
      await sendBrevoEmail(email, env);
    } else if (env.emailProvider === 'smtp') {
      await getTransporter().sendMail({ ...email, from: env.smtp.from });
    } else {
      throw new AppError('Email provider is not configured correctly.', 503);
    }
  } catch (error) {
    logger.error('OTP email failed', { provider: env.emailProvider, code: error.code, statusCode: error.statusCode, purpose });
    if (error instanceof AppError) throw error;
    throw new AppError('Unable to send OTP email. Please try again later.', 502);
  }
}
