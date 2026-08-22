import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    let host = process.env.SMTP_HOST || "smtp.gmail.com";
    if (host.includes("@") || !host) {
      host = "smtp.gmail.com";
    }
    const port = Number(process.env.SMTP_PORT || (host === "smtp.gmail.com" ? 465 : 587));
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`SMTP Mail Transporter configured for ${user} (${host}:${port})`);
    } else {
      this.logger.warn(
        "SMTP credentials not fully configured (SMTP_USER / SMTP_PASS). Password reset emails will log OTP to console as fallback.",
      );
    }
  }

  async sendPasswordResetEmail(toEmail: string, resetCode: string): Promise<boolean> {
    const user = process.env.SMTP_USER;
    const from = process.env.SMTP_FROM || (user ? `"CyberTech Academy" <${user}>` : '"CyberTech Academy" <no-reply@cybertechacademy.com>');

    const subject = `🔑 ${resetCode} is your CyberTech Hunter Academy Password Reset Code`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { background-color: #0b0b14; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; }
            .card { max-width: 520px; margin: 0 auto; background: #13111c; border: 1px solid rgba(147, 51, 234, 0.4); border-radius: 16px; padding: 32px; box-shadow: 0 0 30px rgba(147, 51, 234, 0.2); }
            .brand { font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #00f3ff; text-align: center; text-transform: uppercase; margin-bottom: 4px; }
            .subtitle { font-size: 11px; letter-spacing: 2px; color: #a855f7; text-align: center; text-transform: uppercase; margin-bottom: 24px; }
            .heading { font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 12px; text-align: center; }
            .desc { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; text-align: center; }
            .code-box { background: rgba(0, 243, 255, 0.05); border: 2px dashed #00f3ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
            .code-text { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #00f3ff; font-family: monospace; }
            .expiry { font-size: 12px; color: #fbbf24; text-align: center; margin-top: 12px; }
            .footer { font-size: 11px; color: #71717a; text-align: center; margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">CyberTech</div>
            <div class="subtitle">Hunter Academy • Security Protocol</div>
            <div class="heading">Password Reset Verification</div>
            <div class="desc">
              A request was received to reset the password for your CyberTech Hunter Academy account. Use the verification code below to complete your password update:
            </div>
            <div class="code-box">
              <div class="code-text">${resetCode}</div>
              <div class="expiry">⚡ Valid for 15 minutes</div>
            </div>
            <div class="desc" style="font-size: 12px;">
              If you did not initiate this request, your account is secure and you can safely disregard this transmission.
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} CyberTech Hunter Academy • Digital Realm Mastery
            </div>
          </div>
        </body>
      </html>
    `;

    // If transporter is ready, attempt to send via SMTP
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: toEmail,
          subject,
          text: `Your CyberTech Hunter Academy password reset code is: ${resetCode} (Valid for 15 minutes).`,
          html,
        });
        this.logger.log(`Password reset email successfully delivered to ${toEmail}`);
        return true;
      } catch (err: any) {
        this.logger.error(`Failed to send email via SMTP: ${err.message}`, err.stack);
      }
    }

    // Always log OTP for development / backup fallback
    this.logger.log(`[RESET OTP FALLBACK] Code for ${toEmail}: ${resetCode}`);
    return true;
  }
}
