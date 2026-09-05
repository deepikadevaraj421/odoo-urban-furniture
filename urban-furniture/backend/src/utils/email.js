const nodemailer = require('nodemailer');
const env = require('../config/env');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

/**
 * Send OTP verification email
 * @param {string} to - recipient email
 * @param {string} otp - plain OTP (6 digits)
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Urban Furniture" <${env.SMTP_FROM}>`,
    to,
    subject: 'Your OTP Verification Code — Urban Furniture',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
        <h2 style="color: #00d4aa; margin-bottom: 8px;">Urban Furniture</h2>
        <p style="color: #a0a0b0; margin-bottom: 24px;">OTP Verification</p>
        <div style="background: #16213e; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; color: #c0c0d0;">Your One-Time Password:</p>
          <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #00d4aa;">${otp}</h1>
        </div>
        <p style="color: #808090; font-size: 14px;">This OTP expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #808090; font-size: 14px;">If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;">
        <p style="color: #606070; font-size: 12px;">© Urban Furniture ERP System</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send account activation email to new accountants
 * @param {string} to - recipient email
 * @param {string} name - accountant name
 * @param {string} accountantCode - generated accountant code
 * @param {string} tempPassword - temporary password
 */
const sendAccountActivationEmail = async (to, name, accountantCode, tempPassword) => {
  const mailOptions = {
    from: `"Urban Furniture" <${env.SMTP_FROM}>`,
    to,
    subject: 'Your Account Has Been Created — Urban Furniture',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
        <h2 style="color: #00d4aa; margin-bottom: 8px;">Urban Furniture</h2>
        <p style="color: #a0a0b0; margin-bottom: 24px;">Account Activation</p>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your accountant account has been created. Here are your login details:</p>
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong style="color: #00d4aa;">Accountant Code:</strong> ${accountantCode}</p>
          <p style="margin: 4px 0;"><strong style="color: #00d4aa;">Email:</strong> ${to}</p>
          <p style="margin: 4px 0;"><strong style="color: #00d4aa;">Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color: #ff6b6b; font-size: 14px;">⚠️ Please change your password after first login.</p>
        <p style="color: #808090; font-size: 14px;">You can login using your email or accountant code along with your password.</p>
        <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;">
        <p style="color: #606070; font-size: 12px;">© Urban Furniture ERP System</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendAccountActivationEmail, transporter };
