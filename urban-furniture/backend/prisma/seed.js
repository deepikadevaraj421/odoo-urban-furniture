const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking database seed status...\n');

  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' },
  });

  if (adminCount > 0) {
    console.log(`✅ System already has ${adminCount} Admin account(s).`);
  } else {
    console.log('ℹ️  No Admin account found.');
    console.log('👉 Perform initial one-time Admin registration at: http://localhost:5173/admin/register');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed check failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
