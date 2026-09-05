const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Searching for existing ADMIN records in urban_furniture_db...\n');

  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (adminUsers.length === 0) {
    console.log('✅ No ADMIN records found in the database.');
    return;
  }

  console.log(`⚠️  FOUND ${adminUsers.length} ADMIN RECORD(S) TO BE REMOVED:`);
  console.log(JSON.stringify(adminUsers, null, 2));

  // Remove related OTPs first for cascade safety
  const adminIds = adminUsers.map((u) => u.id);

  const deletedOtps = await prisma.otp.deleteMany({
    where: { userId: { in: adminIds } },
  });
  console.log(`\n🧹 Cleaned up ${deletedOtps.count} related OTP record(s).`);

  const deletedAdmins = await prisma.user.deleteMany({
    where: { role: 'ADMIN' },
  });

  console.log(`✅ Successfully removed ${deletedAdmins.count} ADMIN user account(s).`);
  console.log('🔒 All Accountant, Customer, and business records remain 100% untouched.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
