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
 * Verify SMTP transporter connection safely on startup
 */
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('  ✉️   Email transporter: READY (SMTP verified successfully)');
  } catch (err) {
    console.error('  ⚠️   Email transporter FAILED:', err.message);
  }
};

/**
 * Send OTP verification email for Admin initial setup
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Urban Furniture" <${env.SMTP_FROM}>`,
    to,
    subject: 'Admin Setup OTP Verification Code — Urban Furniture',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
        <h2 style="color: #00d4aa; margin-bottom: 8px;">Urban Furniture</h2>
        <p style="color: #a0a0b0; margin-bottom: 24px;">Admin Setup OTP Verification</p>
        <div style="background: #16213e; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; color: #c0c0d0;">Your Admin Setup One-Time Password:</p>
          <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #00d4aa;">${otp}</h1>
        </div>
        <p style="color: #808090; font-size: 14px;">This OTP expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #808090; font-size: 14px;">If you did not initiate Admin registration, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;">
        <p style="color: #606070; font-size: 12px;">© Urban Furniture ERP System</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Accountant Invitation Email
 * Contains NO password. Includes an [ Accept Invitation ] button with secure token link.
 */
const sendAccountantInvitationEmail = async (to, name, accountantCode, accountantType, invitationLink) => {
  const typeLabel = accountantType === 'SALES' ? 'Sales Accountant' : 'Purchase Accountant';

  const mailOptions = {
    from: `"Urban Furniture" <${env.SMTP_FROM}>`,
    to,
    subject: 'You have been invited to join Urban Furniture ERP',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
        <h2 style="color: #00d4aa; margin-bottom: 8px;">Urban Furniture</h2>
        <p style="color: #a0a0b0; margin-bottom: 24px;">Accountant Invitation</p>
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #c0c0d0; line-height: 1.6;">You have been invited to join Urban Furniture as an Accountant.</p>
        
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong style="color: #00d4aa;">Accountant ID:</strong> ${accountantCode}</p>
          <p style="margin: 6px 0;"><strong style="color: #00d4aa;">Role:</strong> Accountant</p>
          <p style="margin: 6px 0;"><strong style="color: #00d4aa;">Type:</strong> ${typeLabel}</p>
        </div>

        <p style="color: #c0c0d0;">Please click the button below to accept your invitation and create your account password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationLink}" style="background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #0b0f19; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(0,242,254,0.3);">
            Accept Invitation
          </a>
        </div>

        <p style="color: #808090; font-size: 13px;">This invitation link is valid for 48 hours and can only be used once.</p>
        <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;">
        <p style="color: #606070; font-size: 12px;">© Urban Furniture ERP System</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  if (info.rejected && info.rejected.length > 0) {
    throw new Error(`Email provider rejected recipient: ${info.rejected.join(', ')}`);
  }
  return info;
};

/**
 * Send Customer Invitation Email
 * Contains NO password. Includes Customer ID, Name, and [ Accept Invitation ] button link.
 */
const sendCustomerInvitationEmail = async (to, name, customerCode, invitationLink) => {
  const mailOptions = {
    from: `"Urban Furniture" <${env.SMTP_FROM}>`,
    to,
    subject: 'Welcome to Urban Furniture – Activate Your Customer Account',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
        <h2 style="color: #00d4aa; margin-bottom: 8px;">Urban Furniture</h2>
        <p style="color: #a0a0b0; margin-bottom: 24px;">Customer Account Activation</p>
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #c0c0d0; line-height: 1.6;">You have been registered as a customer with Urban Furniture.</p>
        
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong style="color: #00d4aa;">Customer ID:</strong> ${customerCode}</p>
          <p style="margin: 6px 0;"><strong style="color: #00d4aa;">Full Name:</strong> ${name}</p>
          <p style="margin: 6px 0;"><strong style="color: #00d4aa;">Registered Email:</strong> ${to}</p>
        </div>

        <p style="color: #c0c0d0;">Click the button below to activate your account and create your password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationLink}" style="background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #0b0f19; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(0,242,254,0.3);">
            Accept Invitation
          </a>
        </div>

        <p style="color: #808090; font-size: 13px;">This invitation link is valid for 48 hours and can only be used once.</p>
        <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;">
        <p style="color: #606070; font-size: 12px;">© Urban Furniture ERP System</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  if (info.rejected && info.rejected.length > 0) {
    throw new Error(`Email provider rejected recipient: ${info.rejected.join(', ')}`);
  }
  return info;
};

module.exports = {
  sendOtpEmail,
  sendAccountantInvitationEmail,
  sendCustomerInvitationEmail,
  verifyTransporter,
  transporter,
};
