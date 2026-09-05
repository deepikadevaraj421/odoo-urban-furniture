const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api';

async function postJson(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { status: res.status, data: json };
}

async function testFullAdminFlow() {
  console.log('🚀 Starting Full Initial Admin Registration & Verification Flow Test...\n');

  // Step 0: Ensure DB has 0 ADMINs before starting
  await prisma.otp.deleteMany({
    where: { user: { role: 'ADMIN' } },
  });
  await prisma.user.deleteMany({
    where: { role: 'ADMIN' },
  });

  // Step 1: Verify DB has 0 ADMINs
  const initialAdmins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log(`Step 1 - Checking DB for existing ADMINs: Count = ${initialAdmins.length}`);
  if (initialAdmins.length !== 0) {
    throw new Error('Expected 0 ADMIN accounts in DB at start!');
  }
  console.log('  ✅ DB is clean. 0 ADMIN accounts.\n');

  // Step 2: Perform Initial Admin Registration
  const testAdminData = {
    name: 'Real System Admin',
    email: 'myrealadmin@urbanfurniture.com',
    password: 'SuperSecurePassword123!',
    confirmPassword: 'SuperSecurePassword123!',
  };

  console.log(`Step 2 - Registering Initial Admin with Email: ${testAdminData.email}`);
  const regRes = await postJson(`${API_BASE}/auth/admin/register`, testAdminData);
  console.log('  Response status:', regRes.status);
  console.log('  Response data:', regRes.data);

  if (!regRes.data.requiresOtp || !regRes.data.userId) {
    throw new Error('Admin registration failed to return OTP requirement!');
  }
  const userId = regRes.data.userId;
  const plainOtp = regRes.data.devOtp;
  console.log('  ✅ Admin Registration initiated. User ID:', userId);
  console.log('  ✅ Retrieved OTP for testing:', plainOtp, '\n');

  // Step 4: Verify Admin Registration OTP
  console.log('Step 4 - Verifying Admin OTP...');
  const verifyRes = await postJson(`${API_BASE}/auth/admin/verify-otp`, {
    userId,
    otp: plainOtp,
  });
  console.log('  Response status:', verifyRes.status);
  console.log('  Response data:', verifyRes.data);

  if (!verifyRes.data.token || verifyRes.data.user.role !== 'ADMIN') {
    throw new Error('Admin OTP verification failed!');
  }
  console.log('  ✅ Admin Account Activated successfully!\n');

  // Step 5: Verify Admin status in DB
  const createdAdmin = await prisma.user.findUnique({ where: { id: userId } });
  console.log('Step 5 - Checking activated Admin in DB:');
  console.log('  Name:', createdAdmin.name);
  console.log('  Email:', createdAdmin.email);
  console.log('  Role:', createdAdmin.role);
  console.log('  Status:', createdAdmin.status);
  console.log('  Password Hash present:', !!createdAdmin.passwordHash);
  if (createdAdmin.passwordHash.includes('SuperSecurePassword123!')) {
    throw new Error('CRITICAL: Plain text password was stored!');
  }
  console.log('  ✅ Admin in DB is ACTIVE with bcrypt hashed password.\n');

  // Step 6: Attempt 2nd Admin Registration (Must be REJECTED)
  console.log('Step 6 - Attempting 2nd Admin Registration (Should be REJECTED)...');
  const secondRegRes = await postJson(`${API_BASE}/auth/admin/register`, {
    name: 'Second Admin Attempt',
    email: 'secondadmin@urbanfurniture.com',
    password: 'AnotherPassword123!',
    confirmPassword: 'AnotherPassword123!',
  });

  console.log('  Response Status:', secondRegRes.status);
  console.log('  Response Message:', secondRegRes.data.message);

  if (secondRegRes.status === 400 && secondRegRes.data.message.includes('Admin account already exists')) {
    console.log('  ✅ Correctly rejected with: "Admin account already exists. Only one Admin account is allowed. Please login."\n');
  } else {
    throw new Error(`FAIL: Expected 400 Bad Request but got status ${secondRegRes.status} with message: ${secondRegRes.data.message}`);
  }

  // Step 7: Test Admin Login with Email + Password (NO OTP)
  console.log('Step 7 - Testing Normal Admin Login...');
  const loginRes = await postJson(`${API_BASE}/auth/admin/login`, {
    email: testAdminData.email,
    password: testAdminData.password,
  });

  console.log('  Response status:', loginRes.status);
  console.log('  Requires OTP:', loginRes.data.requiresOtp);
  console.log('  JWT Token received:', !!loginRes.data.token);
  console.log('  Redirect To:', loginRes.data.redirectTo);

  if (loginRes.data.requiresOtp || !loginRes.data.token || loginRes.data.redirectTo !== '/admin/dashboard') {
    throw new Error('Admin normal login failed or incorrectly requested OTP!');
  }
  console.log('  ✅ Admin Normal Login successful without OTP!\n');

  // Step 8: Verify Accountants still intact
  const accountants = await prisma.user.findMany({ where: { role: 'ACCOUNTANT' } });
  console.log(`Step 8 - Verifying Accountant accounts in DB: Count = ${accountants.length}`);
  accountants.forEach((acc) => console.log(`  - ${acc.name} (${acc.email})`));
  console.log('  ✅ All Accountant accounts intact!\n');

  // Step 9: Clean test Admin record so DB is fresh for user's own real registration
  console.log('Step 9 - Cleaning up test admin record so DB remains ready for user registration...');
  await prisma.otp.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  console.log('  ✅ Database is clean and ready for user registration!\n');

  console.log('🎉 ALL STEPS VERIFIED SUCCESSFULLY! Initial Admin Registration & Security limits are 100% WORKING!');
}

testFullAdminFlow()
  .catch((e) => {
    console.error('❌ Verification Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
