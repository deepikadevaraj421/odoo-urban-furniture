const prisma = require('./src/config/database');
const jwt = require('jsonwebtoken');
const env = require('./src/config/env');
const adminService = require('./src/modules/admin/admin.service');
const { getDefaultPermissions } = require('./src/constants/permissions');

async function runTest() {
  console.log('====================================================');
  console.log('  RUNNING PERMISSION ACCESS CONTROL VERIFICATION');
  console.log('====================================================\n');

  // 1. Find or create a test sales accountant
  let user = await prisma.user.findFirst({
    where: { role: 'ACCOUNTANT', accountant: { accountantType: 'SALES' } },
    include: { accountant: true },
  });

  if (!user) {
    console.error('❌ No Sales Accountant found in DB.');
    process.exit(1);
  }

  console.log(`✅ Target Accountant: ${user.name} (${user.email})`);
  console.log(`   Accountant ID: ${user.accountant.accountantCode}`);
  console.log(`   Accountant Type: ${user.accountant.accountantType}`);
  console.log(`   Current DB Permissions (${user.accountant.permissions.length}):`);
  console.log(`   ${user.accountant.permissions.slice(0, 5).join(', ')}...`);

  // Activate accountant if not active so token is accepted
  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'ACTIVE' },
  });

  const accountantToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 2. Test Step: Admin disables CREATE_SALES_ORDERS
  console.log('\n--- Step 1: Admin disables CREATE_SALES_ORDERS in PostgreSQL ---');
  const defaults = getDefaultPermissions('SALES');
  const permsWithoutSO = defaults.filter((p) => p !== 'CREATE_SALES_ORDERS');

  const updateRes = await adminService.updateAccountantPermissions(
    user.accountant.id,
    permsWithoutSO
  );

  if (!updateRes.success) {
    console.error('❌ Failed to update permissions:', updateRes.message);
    process.exit(1);
  }

  // Verify PostgreSQL directly
  const inDb = await prisma.accountant.findUnique({
    where: { id: user.accountant.id },
  });

  const hasSOInDb = inDb.permissions.includes('CREATE_SALES_ORDERS');
  console.log(`✅ DB Verification: CREATE_SALES_ORDERS present in DB? ${hasSOInDb} (Expected: false)`);
  if (hasSOInDb) {
    console.error('❌ Permission failed to persist in DB.');
    process.exit(1);
  }

  // 3. Step 2: Accountant attempts direct API request without permission
  console.log('\n--- Step 2: Accountant attempts POST /api/sales-orders (Forbidden) ---');
  const resForbidden = await fetch('http://localhost:5000/api/sales-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accountantToken}`,
    },
    body: JSON.stringify({ notes: 'Unauthorized order attempt' }),
  });

  const forbiddenData = await resForbidden.json();
  console.log(`   Status Code: ${resForbidden.status} (Expected: 403)`);
  console.log(`   Response Body:`, forbiddenData);

  if (resForbidden.status !== 403) {
    console.error(`❌ Security failure: Expected 403 Forbidden, got ${resForbidden.status}`);
    process.exit(1);
  }

  console.log('✅ Backend successfully blocked unauthorized request with 403 Forbidden!');

  // 4. Step 3: Admin re-enables CREATE_SALES_ORDERS
  console.log('\n--- Step 3: Admin re-enables CREATE_SALES_ORDERS in PostgreSQL ---');
  const permsWithSO = [...permsWithoutSO, 'CREATE_SALES_ORDERS'];
  await adminService.updateAccountantPermissions(user.accountant.id, permsWithSO);

  const inDbAfter = await prisma.accountant.findUnique({
    where: { id: user.accountant.id },
  });
  console.log(`✅ DB Verification: CREATE_SALES_ORDERS present in DB? ${inDbAfter.permissions.includes('CREATE_SALES_ORDERS')} (Expected: true)`);

  // 5. Step 4: Accountant calls POST /api/sales-orders again
  console.log('\n--- Step 4: Accountant attempts POST /api/sales-orders (Allowed) ---');
  const resAllowed = await fetch('http://localhost:5000/api/sales-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accountantToken}`,
    },
    body: JSON.stringify({ notes: 'Authorized order attempt' }),
  });

  const allowedData = await resAllowed.json();
  console.log(`   Status Code: ${resAllowed.status}`);
  console.log(`   Response Message:`, allowedData.message);

  if (resAllowed.status === 403) {
    console.error('❌ Still received 403 Forbidden after permission was enabled.');
    process.exit(1);
  }

  console.log('✅ Request passed authorization check (did NOT receive 403)!');

  // 6. Step 5: Test Admin full access bypass
  console.log('\n--- Step 5: Admin full access bypass test ---');
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    const adminToken = jwt.sign(
      { userId: admin.id, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resAdmin = await fetch('http://localhost:5000/api/sales-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    console.log(`   Admin Status Code: ${resAdmin.status} (Expected: non-403)`);
    if (resAdmin.status === 403) {
      console.error('❌ Admin was blocked by permission check.');
      process.exit(1);
    }
    console.log('✅ Admin successfully bypassed permission check with full access!');
  }

  // Restore default permissions
  await adminService.updateAccountantPermissions(
    user.accountant.id,
    getDefaultPermissions(user.accountant.accountantType)
  );
  console.log('\n✅ Restored target accountant permissions to defaults.');
  console.log('\n🎉 ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
}

runTest()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error during test:', e);
    process.exit(1);
  });
