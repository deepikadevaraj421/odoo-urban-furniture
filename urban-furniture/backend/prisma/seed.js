const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@urbanfurniture.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists. Skipping seed.');
    console.log(`   Email: ${existingAdmin.email}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdBy: 'SYSTEM',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   Name:  ${admin.name}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role:  ${admin.role}`);
  console.log(`   ID:    ${admin.id}`);
  console.log('\n⚠️  Default password: Admin@123 — Change this in production!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
