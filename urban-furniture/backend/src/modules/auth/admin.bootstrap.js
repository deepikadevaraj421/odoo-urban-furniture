const prisma = require('../../config/database');
const { hashPassword } = require('./password.service');
const env = require('../../config/env');

/**
 * Ensures exactly ONE official Admin exists upon server startup.
 * - If an Admin exists: preserves it and does nothing (no recreation, no duplicate).
 * - If no Admin exists: creates the official configured Admin account.
 */
const bootstrapAdmin = async () => {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log(`  👤  Official Admin verified: ${existingAdmin.email} [${existingAdmin.status}]`);
      return existingAdmin;
    }

    const email = (env.ADMIN_EMAIL || 'admin123@gmail.com').trim().toLowerCase();
    const password = env.ADMIN_PASSWORD || 'Admin123-';
    const name = env.ADMIN_NAME || 'Admin';

    const passwordHash = await hashPassword(password);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        createdBy: 'INITIAL_SETUP',
      },
    });

    console.log(`  ✅  Initial Admin account bootstrapped: ${newAdmin.email}`);
    return newAdmin;
  } catch (err) {
    console.error('  ⚠️  Admin bootstrap check error:', err.message);
  }
};

module.exports = { bootstrapAdmin };
