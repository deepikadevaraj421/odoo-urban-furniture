const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const env = require('../../config/env');
const { sendOtpEmail } = require('../../utils/email');

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP string
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Create a new OTP for a user
 * - Invalidates any existing unused OTPs for the user
 * - Generates a new OTP, hashes it, stores in DB
 * - Sends the plain OTP via email
 * 
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<boolean>} true if OTP was created and sent successfully
 */
const createAndSendOtp = async (userId, email) => {
  // Invalidate existing unused OTPs for this user
  await prisma.otp.updateMany({
    where: {
      userId,
      verifiedAt: null,
    },
    data: {
      // Set them as expired by backdating
      expiresAt: new Date(0),
    },
  });

  // Generate OTP
  const plainOtp = generateOtp();

  // Hash OTP before storing
  const otpHash = await bcrypt.hash(plainOtp, 10);

  // Calculate expiry
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store in database
  await prisma.otp.create({
    data: {
      userId,
      otpHash,
      expiresAt,
      attempts: 0,
    },
  });

  // Log OTP in development mode for easy testing
  if (env.NODE_ENV === 'development') {
    console.log(`[DEV OTP] Generated OTP for ${email}: ${plainOtp}`);
  }

  // Send OTP via email
  await sendOtpEmail(email, plainOtp);

  return plainOtp;
};

/**
 * Verify an OTP for a user
 * 
 * Checks: existence, expiry, max attempts, hash match
 * Marks as verified on success
 * 
 * @param {string} userId
 * @param {string} plainOtp
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
const verifyOtp = async (userId, plainOtp) => {
  // Get the latest unverified OTP for this user
  const otpRecord = await prisma.otp.findFirst({
    where: {
      userId,
      verifiedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  // Check expiry
  if (new Date() > otpRecord.expiresAt) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Check max attempts
  if (otpRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
    return { valid: false, message: 'Maximum OTP attempts exceeded. Please request a new one.' };
  }

  // Increment attempt count
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { attempts: otpRecord.attempts + 1 },
  });

  // Verify OTP hash
  const isMatch = await bcrypt.compare(plainOtp, otpRecord.otpHash);

  if (!isMatch) {
    const remainingAttempts = env.OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
    return {
      valid: false,
      message: remainingAttempts > 0
        ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
        : 'Maximum OTP attempts exceeded. Please request a new one.',
    };
  }

  // Mark as verified — prevents reuse
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { verifiedAt: new Date() },
  });

  return { valid: true, message: 'OTP verified successfully.' };
};

module.exports = { generateOtp, createAndSendOtp, verifyOtp };
