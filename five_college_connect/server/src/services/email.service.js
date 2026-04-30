import Mailjet from "node-mailjet";

import { env } from "../config/env.js";

function buildVerificationEmailText(verificationUrl) {
  return [
    "Welcome to Five College Connect.",
    "",
    "Please verify your email address by visiting this link:",
    verificationUrl,
    "",
    "If you did not create this account, you can ignore this email."
  ].join("\n");
}

function buildVerificationEmailHtml(verificationUrl) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin-bottom: 16px;">Verify your email</h2>
      <p>Welcome to Five College Connect.</p>
      <p>Please confirm your email address to finish setting up your account.</p>
      <p style="margin: 24px 0;">
        <a
          href="${verificationUrl}"
          style="background: #111827; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 6px; display: inline-block;"
        >
          Verify Email
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;
}

export class EmailService {
  constructor() {
    this.mailjet = env.mailjetApiKey && env.mailjetApiSecret
      ? new Mailjet({
        apiKey: env.mailjetApiKey,
        apiSecret: env.mailjetApiSecret
      })
      : null;
  }

  validateConfiguration() {
    if (!env.mailjetApiKey && !env.mailjetApiSecret && !env.emailFrom) {
      return;
    }

    if (!env.mailjetApiKey) {
      throw new Error("MAILJET_API_KEY must be set when EMAIL_FROM is configured");
    }

    if (!env.mailjetApiSecret) {
      throw new Error("MAILJET_API_SECRET must be set when EMAIL_FROM is configured");
    }

    if (!env.emailFrom) {
      throw new Error("EMAIL_FROM must be set when Mailjet is configured");
    }
  }

  async sendVerificationEmail({ to, verificationUrl }) {
    this.validateConfiguration();

    if (!this.mailjet) {
      console.info(`Email verification link for ${to}: ${verificationUrl}`);
      return {
        skipped: true,
        provider: "console"
      };
    }

    const [fromName, fromEmail] = env.emailFrom.match(/^(.*)<([^>]+)>$/)?.slice(1).map((value) => value.trim()) || ["Five College Connect", env.emailFrom.trim()];

    const result = await this.mailjet
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName
            },
            To: [
              {
                Email: to
              }
            ],
            Subject: "Verify your Five College Connect email",
            TextPart: buildVerificationEmailText(verificationUrl),
            HTMLPart: buildVerificationEmailHtml(verificationUrl),
            ReplyTo: env.emailReplyTo
              ? {
                Email: env.emailReplyTo
              }
              : undefined,
            CustomID: "email_verification"
          }
        ]
      });

    const message = result.body?.Messages?.[0];

    return {
      skipped: false,
      provider: "mailjet",
      emailId: message?.To?.[0]?.MessageID ?? null
    };
  }
}
