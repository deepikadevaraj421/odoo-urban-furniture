const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5000/api';

async function runCleanAuthTestSuite() {
  console.log('==================================================');
  console.log('🧪 URBAN FURNITURE ERP — CLEAN AUTH TEST SUITE');
  console.log('==================================================\n');

  try {
    // 0. Verify DB is clean (0 users)
    const userCount = await prisma.user.count();
    console.log(`📊 Initial DB User Count: ${userCount}`);
    if (userCount !== 0) {
      console.error('❌ Database is not clean! Count must be 0.');
      process.exit(1);
    }
    console.log('✅ Step 0 Verified: Database has ZERO users.\n');

    // TEST 1: First Admin Registration & OTP Verification
    console.log('--- TEST 1: Admin Registration & OTP Verification ---');
    const adminData = {
      name: 'System Admin',
      email: 'admin.test@urbanfurniture.com',
      password: 'AdminPassword123!',
      confirmPassword: 'AdminPassword123!',
    };

    const regResponse = await fetch(`${API_BASE}/auth/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData),
    });
    const regData = await regResponse.json();
    console.log('Register API Response:', regData);

    if (!regResponse.ok || !regData.success || !regData.userId) {
      throw new Error(`Admin registration failed! (${JSON.stringify(regData)})`);
    }
    const adminUserId = regData.userId;

    // Verify OTP
    const verifyResponse = await fetch(`${API_BASE}/auth/admin/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: adminUserId,
        otp: regData.devOtp,
      }),
    });
    const verifyData = await verifyResponse.json();
    console.log('Verify OTP API Response:', verifyData);

    if (!verifyResponse.ok || !verifyData.success || !verifyData.token) {
      throw new Error(`Admin OTP verification failed! (${JSON.stringify(verifyData)})`);
    }

    // Verify DB status is ACTIVE
    const activeAdmin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (activeAdmin.status !== 'ACTIVE') {
      throw new Error(`Admin status is ${activeAdmin.status}, expected ACTIVE!`);
    }
    console.log('✅ TEST 1 PASSED: Admin created and status is ACTIVE.\n');

    // TEST 2: Admin Normal Login (Correct Email + Password)
    console.log('--- TEST 2: Admin Normal Login ---');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginType: 'ADMIN',
        email: adminData.email,
        password: adminData.password,
      }),
    });
    const loginData = await loginResponse.json();
    console.log('Login API Response:', loginData);

    if (!loginResponse.ok || !loginData.success || !loginData.token) {
      throw new Error(`Admin normal login failed! (${JSON.stringify(loginData)})`);
    }
    const adminJwtToken = loginData.token;
    console.log('✅ TEST 2 PASSED: Admin login returned valid JWT token.\n');

    // TEST 3: Admin Login with Wrong Password
    console.log('--- TEST 3: Admin Login Wrong Password ---');
    const wrongPassResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginType: 'ADMIN',
        email: adminData.email,
        password: 'WrongPassword999!',
      }),
    });
    const wrongPassData = await wrongPassResponse.json();
    console.log('Wrong Password Response:', wrongPassResponse.status, wrongPassData);

    if (wrongPassResponse.status === 401) {
      console.log(`✅ TEST 3 PASSED: Returned 401 Unauthorized (${wrongPassData.message}).\n`);
    } else {
      throw new Error(`Expected 401, got ${wrongPassResponse.status}`);
    }

    // TEST 4: Admin Login Nonexistent Email
    console.log('--- TEST 4: Admin Login Nonexistent Email ---');
    const noEmailResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginType: 'ADMIN',
        email: 'nobody@urbanfurniture.com',
        password: adminData.password,
      }),
    });
    const noEmailData = await noEmailResponse.json();
    console.log('Nonexistent Email Response:', noEmailResponse.status, noEmailData);

    if (noEmailResponse.status === 401) {
      console.log(`✅ TEST 4 PASSED: Returned 401 Unauthorized (${noEmailData.message}).\n`);
    } else {
      throw new Error(`Expected 401, got ${noEmailResponse.status}`);
    }

    // TEST 5: Second Admin Registration (Must be blocked)
    console.log('--- TEST 5: Second Admin Registration Attempt ---');
    const secondRegResponse = await fetch(`${API_BASE}/auth/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Admin',
        email: 'secondadmin@urbanfurniture.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const secondRegData = await secondRegResponse.json();
    console.log('Second Admin Reg Response:', secondRegResponse.status, secondRegData);

    if (secondRegResponse.status === 400 && !secondRegData.success) {
      console.log(`✅ TEST 5 PASSED: Second admin blocked with 400 (${secondRegData.message}).\n`);
    } else {
      throw new Error(`Expected 400 Bad Request, got ${secondRegResponse.status}`);
    }

    // TEST 6: Admin creates Accountant
    console.log('--- TEST 6: Admin Creates Accountant ---');
    const accResponse = await fetch(`${API_BASE}/admin/accountants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminJwtToken}`,
      },
      body: JSON.stringify({
        name: 'Sales Accountant User',
        email: 'kanimozhiaws03@gmail.com',
        mobile: '9876543210',
        employeeId: 'EMP-ACC-001',
        department: 'Sales Finance',
        accountantType: 'SALES',
      }),
    });
    const accData = await accResponse.json();
    console.log('Create Accountant Response:', accResponse.status, accData);

    if (!accResponse.ok || !accData.success || !accData.accountant?.accountantCode) {
      throw new Error(`Creating accountant failed! (${JSON.stringify(accData)})`);
    }
    console.log(`✅ TEST 6 PASSED: Accountant created with code ${accData.accountant.accountantCode}.\n`);

    // TEST 7: Admin creates Customer (CUS Code Generation)
    console.log('--- TEST 7: Admin Creates Customer ---');
    const custResponse = await fetch(`${API_BASE}/admin/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminJwtToken}`,
      },
      body: JSON.stringify({
        name: 'Kanimozhi Customer',
        email: 'kanimozhi.r2024aiml@sece.ac.in',
        mobile: '9876543211',
        address: '123 Showroom Lane, Chennai',
      }),
    });
    const custData = await custResponse.json();
    console.log('Create Customer Response:', custResponse.status, custData);

    if (!custResponse.ok || !custData.success || !custData.customer?.customerCode) {
      throw new Error(`Creating customer failed! (${JSON.stringify(custData)})`);
    }
    console.log(`✅ TEST 7 PASSED: Customer created with code ${custData.customer.customerCode}.\n`);

    console.log('==================================================');
    console.log('🎉 ALL 7 E2E CLEAN STATE TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (error) {
    console.error('❌ E2E Test Suite Failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCleanAuthTestSuite();
