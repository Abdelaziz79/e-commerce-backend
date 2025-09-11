import nodemailer from "nodemailer";
import config from "../config/config";

interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

/**
 * Send an email using nodemailer with Gmail service
 * @param {EmailData} options - Email data including recipient, subject, and content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>} Result of the email sending operation
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  from,
}: EmailData) {
  // Check required environment variables
  const EMAIL_USER = config.emailUser;
  const EMAIL_PASS = config.emailPass;
  const EMAIL_FROM = config.emailFrom;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
      "Missing email configuration. Please set EMAIL_USER and EMAIL_PASS environment variables."
    );
  }

  try {
    // Create transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS, // App password, not regular Gmail password
      },
      tls: {
        // This disables certificate validation (less secure but fixes common errors)
        rejectUnauthorized: false,
      },
    });

    // Determine sender email
    const senderEmail = from || EMAIL_USER;

    // Set up email data
    const mailOptions = {
      from: `${EMAIL_FROM} <${senderEmail}>`,
      to,
      subject,
      ...(html && { html }),
      ...(text && { text }),
      ...(replyTo && { replyTo }),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send a verification email to a newly registered user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} verificationURL - URL for email verification
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>} Result of the email sending operation
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationURL: string
) {
  const subject = "Please verify your email address";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Email Verification</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can also click on the link below or copy it to your browser:</p>
      <p><a href="${verificationURL}">${verificationURL}</a></p>
      <p>If you did not register for an account, please ignore this email.</p>
      <p style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 10px; color: #777;">Thank you,<br>The E-Commerce Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send a password reset email to a user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} resetURL - URL for password reset
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>} Result of the email sending operation
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetURL: string
) {
  const subject = "Password Reset Request";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Password Reset</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Please click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetURL}" style="background-color: #4285F4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can also click on the link below or copy it to your browser:</p>
      <p><a href="${resetURL}">${resetURL}</a></p>
      <p>This password reset link is valid for 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 10px; color: #777;">Thank you,<br>The E-Commerce Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}
