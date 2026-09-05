const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const { sendAccountantInvitationEmail, sendCustomerInvitationEmail } = require('../../utils/email');

const INVITATION_EXPIRY_HOURS = 48;

/**
 * Generate and send an Accountant or Customer Invitation
 */
const createAndSendInvitation = async ({ userId, email, name, accountantCode, accountantType, customerCode }) => {
  // Invalidate any existing invitations for this user
  await prisma.invitation.deleteMany({
    where: { userId },
  });

  // Generate cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Hash token before storing in DB
  const tokenHash = await bcrypt.hash(rawToken, 10);

  // Set 48-hour expiration
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  // Store in database
  const invitation = await prisma.invitation.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  // Build frontend accept-invitation URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const invitationLink = `${frontendUrl}/accept-invitation?token=${rawToken}&id=${invitation.id}`;

  // Send invitation email based on role
  let sendInfo;
  if (customerCode) {
    sendInfo = await sendCustomerInvitationEmail(email, name, customerCode, invitationLink);
  } else {
    sendInfo = await sendAccountantInvitationEmail(email, name, accountantCode, accountantType, invitationLink);
  }

  return {
    success: true,
    invitationId: invitation.id,
    messageId: sendInfo?.messageId,
  };
};

/**
 * Verify invitation token details for the frontend preview page
 */
const getInvitationDetails = async (invitationId, rawToken) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      user: {
        include: {
          accountant: true,
          customer: true,
        },
      },
    },
  });

  if (!invitation) {
    return { valid: false, message: 'Invalid or expired invitation link.' };
  }

  if (invitation.acceptedAt) {
    return { valid: false, message: 'This invitation has already been used.' };
  }

  if (new Date() > invitation.expiresAt) {
    return { valid: false, message: 'This invitation link has expired. Please contact Admin/Accountant.' };
  }

  // Compare token hash
  const isTokenValid = await bcrypt.compare(rawToken, invitation.tokenHash);
  if (!isTokenValid) {
    return { valid: false, message: 'Invalid invitation token.' };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      name: invitation.user.name,
      email: invitation.user.email,
      role: invitation.user.role,
      accountantCode: invitation.user.accountant?.accountantCode,
      accountantType: invitation.user.accountant?.accountantType,
      customerCode: invitation.user.customer?.customerCode,
    },
  };
};

/**
 * Accept invitation and set accountant password
 */
const acceptInvitationAndSetPassword = async (invitationId, rawToken, newPassword) => {
  // Check details
  const details = await getInvitationDetails(invitationId, rawToken);
  if (!details.valid) {
    return { success: false, message: details.message };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user and invitation in transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: invitation.userId },
      data: {
        passwordHash,
        status: 'ACTIVE',
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
      },
    }),
  ]);

  return {
    success: true,
    message: 'Password set successfully! You can now log in to your account.',
  };
};

module.exports = {
  createAndSendInvitation,
  getInvitationDetails,
  acceptInvitationAndSetPassword,
};
