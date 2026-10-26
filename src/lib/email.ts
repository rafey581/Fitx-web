import "server-only";

import nodemailer from "nodemailer";

import { env } from "@/lib/env";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(env.SMTP_HOST);
}

/**
 * Send an email when SMTP is configured; otherwise log it.
 *
 * Returning false (rather than throwing) keeps lead capture and password reset
 * working in environments without SMTP, which is the expected dev setup.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.info(
      `[email] SMTP not configured - would send "${message.subject}" to ${message.to}`,
    );
    if (!env.isProduction) {
      console.info(`[email] body:\n${message.text}`);
    }
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined,
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return true;
  } catch (error) {
    console.error("[email] failed to send", error);
    return false;
  }
}
