/**
 * Email Service — Nodemailer Integration
 * Provides reusable email sending functionality for the Lakwedha notification system.
 */

const nodemailer = require('nodemailer');
const { notificationConfig } = require('../config/notification.config');

// ── Nodemailer Transporter ───────────────────────────────────────────────────
let transporter = null;

/**
 * Initialize the Nodemailer transporter with Gmail SMTP settings.
 * Called lazily on first send, or can be called explicitly at startup.
 */
const initEmailTransporter = () => {
  const { host, port, user, pass } = notificationConfig.email;

  if (!user || !pass) {
    console.error('❌ Email Service: Email credentials are missing. Emails will not be sent.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });

    console.log('✅ Email Service: Nodemailer transporter initialized successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Email Service: Failed to initialize transporter:', error.message);
    return null;
  }
};

/**
 * Send an email via Nodemailer.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} message - Email body (plain text; also rendered as simple HTML)
 * @returns {Promise<object>} - Send result or error object
 */
const sendEmail = async (to, subject, message) => {
  try {
    // Lazy-initialize transporter if not yet created
    if (!transporter) {
      const initialized = initEmailTransporter();
      if (!initialized) {
        throw new Error('Email transporter is not initialized. Check your credentials.');
      }
    }

    // Validate inputs
    if (!to || !to.includes('@')) {
      throw new Error(`Invalid email address: ${to}`);
    }
    if (!subject || subject.trim().length === 0) {
      throw new Error('Email subject cannot be empty');
    }
    if (!message || message.trim().length === 0) {
      throw new Error('Email message body cannot be empty');
    }

    console.log(`📧 Email Service: Sending email to ${to}...`);

    // Build HTML version from plain text (preserves line breaks)
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #2c3e50;">Lakwedha Health System</h2>
        <hr style="border: 1px solid #ecf0f1;" />
        <div style="padding: 15px 0; line-height: 1.6;">
          ${message.replace(/\n/g, '<br />')}
        </div>
        <hr style="border: 1px solid #ecf0f1;" />
        <p style="color: #95a5a6; font-size: 12px;">
          This is an automated message from the Lakwedha Health System. 
          Please do not reply to this email.
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"Lakwedha Health" <${notificationConfig.email.user}>`,
      to: to,
      subject: subject,
      text: message,
      html: htmlBody,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email Service: Email sent successfully (Message ID: ${result.messageId})`);

    return {
      success: true,
      messageId: result.messageId,
      to: to,
    };
  } catch (error) {
    console.error(`❌ Email Service: Failed to send email to ${to}:`, error.message);

    return {
      success: false,
      error: error.message,
      to: to,
    };
  }
};

module.exports = { initEmailTransporter, sendEmail };
