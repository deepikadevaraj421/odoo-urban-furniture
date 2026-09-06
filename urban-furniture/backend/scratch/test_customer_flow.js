const prisma = require('../src/config/database');
const { generateToken } = require('../src/modules/auth/jwt.service');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const BASE_URL = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}

async function runTest() {
  console.log('\n=============================================================');
  console.log('🧪 TESTING COMPLETE CUSTOMER INVITATION & AUTHENTICATION FLOW');
  console.log('=============================================================\n');

  // 0. Clean up any previous test user with this test email
  const testEmail = 'kanimozhi263010+nimesh@gmail.com';
  const existing = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('🧹 Cleaned up existing test user record.');
  }

  // 1. Get Admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    throw new Error('No Admin user found in database.');
  }
  const adminToken = generateToken({ userId: admin.id, role: admin.role });
  console.log('✅ 1. Admin JWT generated for:', admin.email);

  // 2. Admin creates new customer via POST /api/admin/customers
  console.log('\n--- 2. Calling POST /api/admin/customers ---');
  const createRes = await apiRequest('/admin/customers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: 'http://localhost:5173',
    },
    body: JSON.stringify({
      name: 'Nimesh Pathak',
      email: testEmail,
      mobile: '+91 9840123456',
      address: '104 Anna Salai, Chennai, Tamil Nadu',
    }),
  });

  if (!createRes.ok) {
    console.error('❌ Failed to create customer:', createRes.data);
    process.exit(1);
  }

  console.log('✅ Customer created via API! Response:', createRes.data.message);
  const customerData = createRes.data.customer;
  console.log('   Customer ID:', customerData.customerCode);
  console.log('   Status:', customerData.status);

  // 3. Verify in PostgreSQL
  console.log('\n--- 3. Verifying PostgreSQL records ---');
  const userInDb = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { customer: true, invitation: true },
  });

  if (!userInDb) throw new Error('User not found in DB!');
  if (userInDb.role !== 'CUSTOMER') throw new Error(`Expected role CUSTOMER, got ${userInDb.role}`);
  if (userInDb.status !== 'INVITED') throw new Error(`Expected status INVITED, got ${userInDb.status}`);
  if (!userInDb.customer) throw new Error('Customer record not linked in DB!');
  if (!userInDb.invitation) throw new Error('Invitation record not found in DB!');
  if (userInDb.invitation.acceptedAt !== null) throw new Error('Invitation should not be accepted yet!');

  console.log('✅ User in DB: role =', userInDb.role, '| status =', userInDb.status);
  console.log('✅ Customer in DB: code =', userInDb.customer.customerCode);
  console.log('✅ Invitation in DB: ID =', userInDb.invitation.id, '| expires =', userInDb.invitation.expiresAt);

  // 4. Test Resend Invitation
  console.log('\n--- 4. Testing Resend Invitation ---');
  const resendRes = await apiRequest(`/admin/customers/${customerData.id}/resend-invitation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: 'http://localhost:5173',
    },
  });

  if (!resendRes.ok) {
    console.error('❌ Failed to resend invitation:', resendRes.data);
    process.exit(1);
  }
  console.log('✅ Resend Invitation response:', resendRes.data.message);

  // Get the latest invitation from DB
  const latestInvitation = await prisma.invitation.findUnique({
    where: { userId: userInDb.id },
  });
  console.log('✅ Fresh invitation token generated in DB, ID:', latestInvitation.id);

  // 5. Test Accept Invitation Page: Get Invitation Details
  const testRawToken = crypto.randomBytes(32).toString('hex');
  const testTokenHash = await bcrypt.hash(testRawToken, 10);
  await prisma.invitation.update({
    where: { id: latestInvitation.id },
    data: { tokenHash: testTokenHash },
  });

  console.log('\n--- 5. Calling GET /api/auth/invitation-info ---');
  const infoRes = await apiRequest(`/auth/invitation-info?token=${testRawToken}&id=${latestInvitation.id}`);
  if (!infoRes.ok) {
    console.error('❌ Failed to get invitation info:', infoRes.data);
    process.exit(1);
  }
  console.log('✅ Invitation Info received:', {
    name: infoRes.data.invitation.name,
    email: infoRes.data.invitation.email,
    customerCode: infoRes.data.invitation.customerCode,
  });

  // 6. Test Accept Invitation: Set Password
  console.log('\n--- 6. Calling POST /api/auth/accept-invitation ---');
  const newPassword = 'CustomerSecurePassword#2026';
  const acceptRes = await apiRequest('/auth/accept-invitation', {
    method: 'POST',
    body: JSON.stringify({
      invitationId: latestInvitation.id,
      token: testRawToken,
      newPassword,
      confirmPassword: newPassword,
    }),
  });

  if (!acceptRes.ok) {
    console.error('❌ Failed to accept invitation:', acceptRes.data);
    process.exit(1);
  }
  console.log('✅ Accept invitation response:', acceptRes.data.message);

  // 7. Verify Database state: status = ACTIVE, passwordHash set, invitation.acceptedAt set
  console.log('\n--- 7. Verifying DB state after password set ---');
  const activeUser = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { invitation: true },
  });
  if (activeUser.status !== 'ACTIVE') throw new Error(`Expected ACTIVE, got ${activeUser.status}`);
  if (!activeUser.passwordHash) throw new Error('passwordHash should be set!');
  if (!activeUser.invitation.acceptedAt) throw new Error('acceptedAt should be set!');
  console.log('✅ User is now ACTIVE! Password hash verified.');
  console.log('✅ Invitation acceptedAt:', activeUser.invitation.acceptedAt);

  // 8. Test Reuse of Invitation (Should Fail)
  console.log('\n--- 8. Testing Invitation Reuse (Should Fail) ---');
  const reuseRes = await apiRequest('/auth/accept-invitation', {
    method: 'POST',
    body: JSON.stringify({
      invitationId: latestInvitation.id,
      token: testRawToken,
      newPassword: 'AnotherPassword123',
      confirmPassword: 'AnotherPassword123',
    }),
  });

  if (reuseRes.status === 400) {
    console.log('✅ Reusing invitation correctly rejected with 400:', reuseRes.data.message);
  } else {
    console.error('❌ Reusing invitation should have failed! Got status:', reuseRes.status);
    process.exit(1);
  }

  // 9. Test Customer Login with WRONG Password (Should Fail with 401)
  console.log('\n--- 9. Testing Customer Login with WRONG Password (Should Fail with 401) ---');
  const wrongLoginRes = await apiRequest('/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPasswordXYZ',
    }),
  });

  if (wrongLoginRes.status === 401) {
    console.log('✅ Login with wrong password correctly rejected with 401:', wrongLoginRes.data.message);
  } else {
    console.error('❌ Expected 401, got:', wrongLoginRes.status);
    process.exit(1);
  }

  // 10. Test Customer Login with CORRECT Password
  console.log('\n--- 10. Testing Customer Login with CORRECT Password ---');
  const loginRes = await apiRequest('/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });

  if (!loginRes.ok) {
    console.error('❌ Customer login failed:', loginRes.data);
    process.exit(1);
  }
  console.log('✅ Customer login HTTP 200 SUCCESS!');
  console.log('   User:', loginRes.data.user);
  console.log('   Requires OTP:', loginRes.data.requiresOtp, '(NO OTP for Customer)');
  console.log('   Redirect to:', loginRes.data.redirectTo);

  const customerToken = loginRes.data.token;

  // 11. Test Customer Dashboard API using Customer JWT
  console.log('\n--- 11. Testing Customer Dashboard API ---');
  const dashRes = await apiRequest('/customer/dashboard', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (!dashRes.ok) {
    console.error('❌ Customer dashboard request failed:', dashRes.data);
    process.exit(1);
  }
  console.log('✅ Customer Dashboard accessed! Summary:', {
    customerName: dashRes.data.customer?.name,
    customerCode: dashRes.data.customer?.customerCode,
    invoicesCount: dashRes.data.invoicesCount,
    paymentsCount: dashRes.data.paymentsCount,
  });

  // 12. Test Customer Profile API
  console.log('\n--- 12. Testing Customer Profile API ---');
  const profileRes = await apiRequest('/customer/profile', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (!profileRes.ok) {
    console.error('❌ Customer profile request failed:', profileRes.data);
    process.exit(1);
  }
  console.log('✅ Customer Profile accessed:', {
    customerCode: profileRes.data.customer.customerCode,
    email: profileRes.data.customer.email,
    mobile: profileRes.data.customer.mobile,
  });

  // 13. Test Role Authorization: Customer trying to access Admin API (Should Fail with 403)
  console.log('\n--- 13. Testing Customer Authorization (Access Admin API -> Should Fail with 403) ---');
  const adminAccessRes = await apiRequest('/admin/accountants', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (adminAccessRes.status === 403) {
    console.log('✅ Access denied correctly with HTTP 403:', adminAccessRes.data.message);
  } else {
    console.error('❌ Expected 403, got:', adminAccessRes.status);
    process.exit(1);
  }

  // 14. Test Customer accessing Financial Reports (Should Fail with 403)
  console.log('\n--- 14. Testing Customer Authorization (Access Balance Sheet -> Should Fail with 403) ---');
  const reportAccessRes = await apiRequest('/reports/balance-sheet', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (reportAccessRes.status === 403) {
    console.log('✅ Access denied correctly with HTTP 403:', reportAccessRes.data.message);
  } else {
    console.error('❌ Expected 403, got:', reportAccessRes.status);
    process.exit(1);
  }

  console.log('\n=============================================================');
  console.log('🎉 ALL 14 TEST STEPS PASSED PERFECTLY!');
  console.log('=============================================================\n');
  process.exit(0);
}

runTest().catch((e) => {
  console.error('\n❌ Test execution failed:', e);
  process.exit(1);
});
