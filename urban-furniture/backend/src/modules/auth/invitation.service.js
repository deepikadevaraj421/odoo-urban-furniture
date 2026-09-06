const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const { sendAccountantInvitationEmail, sendCustomerInvitationEmail } = require('../../utils/email');

const INVITATION_EXPIRY_HOURS = 48;

/**
 * Generate and send an Accountant or Customer Invitation
 */
const createAndSendInvitation = async ({
  userId,
  email,
  name,
  accountantCode,
  accountantType,
  customerCode,
  frontendOrigin,
}) => {
  // Invalidate any existing invitations for this user
  await prisma.invitation.deleteMany({
    where: { userId },
  });

  // Generate cryptographically secure random token (32 bytes hex)
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
  const baseUrl = frontendOrigin || process.env.FRONTEND_URL || 'http://localhost:5173';
  const invitationLink = `${baseUrl}/accept-invitation?token=${rawToken}&id=${invitation.id}`;

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
 * Supports lookup by invitationId, or fallback to scanning pending tokens if invitationId is omitted
 */
const getInvitationDetails = async (invitationId, rawToken) => {
  if (!rawToken) {
    return { valid: false, message: 'Invitation token is missing from the link.' };
  }

  let invitation = null;

  // 1. Try finding by ID if provided
  if (invitationId && invitationId.trim() !== '') {
    invitation = await prisma.invitation.findUnique({
      where: { id: invitationId.trim() },
      include: {
        user: {
          include: {
            accountant: true,
            customer: true,
          },
        },
      },
    });
  }

  // 2. If not found by ID or ID was not provided, scan unaccepted invitations matching token
  if (!invitation) {
    const candidateInvitations = await prisma.invitation.findMany({
      where: {
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            accountant: true,
            customer: true,
          },
        },
      },
    });

    for (const cand of candidateInvitations) {
      try {
        const matches = await bcrypt.compare(rawToken, cand.tokenHash);
        if (matches) {
          invitation = cand;
          break;
        }
      } catch (err) {
        // Continue checking others
      }
    }
  }

  if (!invitation) {
    return { valid: false, message: 'Invalid or expired invitation link.' };
  }

  if (invitation.acceptedAt) {
    return { valid: false, message: 'This invitation has already been used. Please log in directly.' };
  }

  if (new Date() > invitation.expiresAt) {
    return { valid: false, message: 'This invitation link has expired. Please contact the administrator for a new invitation.' };
  }

  // Compare token hash to confirm validity
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
 * Accept invitation and set account password
 */
const acceptInvitationAndSetPassword = async (invitationId, rawToken, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  // Verify invitation details
  const details = await getInvitationDetails(invitationId, rawToken);
  if (!details.valid) {
    return { success: false, message: details.message };
  }

  const targetInvitationId = details.invitation.id;
  const invitation = await prisma.invitation.findUnique({
    where: { id: targetInvitationId },
  });

  if (!invitation) {
    return { success: false, message: 'Invitation record not found.' };
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user and invitation in atomic transaction
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
