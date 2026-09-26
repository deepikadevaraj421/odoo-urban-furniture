const prisma = require('../src/config/database');
async function check() {
  const r = await prisma.$queryRawUnsafe('SELECT enum_range(NULL::"Role")');
  console.log('Allowed Postgres Roles:', r);
  process.exit(0);
}
check();
