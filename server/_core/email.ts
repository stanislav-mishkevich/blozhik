import nodemailer from 'nodemailer';
import { ENV } from './env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const smtpUrl = process.env.SMTP_URL || ENV.smtpUrl;
  if (!smtpUrl) return null;
  transporter = nodemailer.createTransport(smtpUrl);
  return transporter;
}

export async function sendNotificationEmail(to: string, subject: string, text: string) {
  const t = getTransporter();
  if (!t) {
    console.warn('[Email] SMTP not configured, skipping email');
    return;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || ENV.smtpFrom || 'no-reply@blozhik.local', to, subject, text });
  } catch (err) {
    console.warn('[Email] Failed to send email', err);
  }
}
