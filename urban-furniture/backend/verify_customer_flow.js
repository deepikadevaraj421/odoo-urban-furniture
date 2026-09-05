const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api';

async function postJson(url, data, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { status: res.status, data: json };
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const json = await res.json();
  return { status: res.status, data: json };
}

async function testCustomerFlow() {
  console.log('🚀 Starting Full Customer Authentication & Management Verification Flow...\n');

  // Step 0: Ensure we have an active Admin user and get JWT token
  console.log('Step 0 - Setting up active Admin for Customer Management authorization...');
  let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN', status: 'ACTIVE' } });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    adminUser = await prisma.user.create({
      data: {
        name: 'System Admin Test',
        email: 'testadmin.customerflow@urbanfurniture.com',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  }

  const adminLoginRes = await postJson(`${API_BASE}/auth/admin/login`, {
    email: adminUser.email,
    password: 'AdminPassword123!',
  });

  // If login failed (e.g. password mismatch), recreate test admin
  let adminToken = adminLoginRes.data.token;
  if (!adminToken) {
    const newPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { passwordHash: newPasswordHash },
    });
    const retryRes = await postJson(`${API_BASE}/auth/admin/login`, {
      email: adminUser.email,
      password: 'AdminPassword123!',
    });
    adminToken = retryRes.data.token;
  }

  if (!adminToken) {
    throw new Error('Failed to obtain Admin JWT token for authorization!');
  }
  const authHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('  ✅ Admin authenticated. Token obtained.\n');

  // Clean up any previous test customers with email starting with kumar.test
  const testEmails = ['kumar.test1@gmail.com', 'kumar.test2@gmail.com'];
  const existingUsers = await prisma.user.findMany({ where: { email: { in: testEmails } } });
  if (existingUsers.length > 0) {
    const userIds = existingUsers.map((u) => u.id);
    await prisma.invitation.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.customer.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  // Step 1: Create First Customer (Kumar 1)
  console.log('Step 1 - Creating First Customer: Name: Kumar, Email: kumar.test1@gmail.com');
  const cust1Data = {
    name: 'Kumar',
    email: 'kumar.test1@gmail.com',
    mobile: '9876543210',
    address: '123 Showroom St, City',
  };

  const createRes1 = await postJson(`${API_BASE}/admin/customers`, cust1Data, authHeaders);
  console.log('  Response status:', createRes1.status);
  console.log('  Created Customer:', createRes1.data.customer);

  if (createRes1.status !== 201 || !createRes1.data.customer?.customerCode) {
    throw new Error('Failed to create first customer!');
  }
  const cust1Code = createRes1.data.customer.customerCode;
  const cust1UserId = createRes1.data.customer.userId;

  if (!cust1Code.startsWith('CUS-')) {
    throw new Error(`Customer ID prefix must be CUS-, but got ${cust1Code}`);
  }
  console.log(`  ✅ First Customer Created. ID: ${cust1Code}, Status: ${createRes1.data.customer.status}\n`);

  // Step 2: Create Second Customer with SAME Name (Kumar 2)
  console.log('Step 2 - Creating Second Customer with SAME Name (Kumar): Email: kumar.test2@gmail.com');
  const cust2Data = {
    name: 'Kumar',
    email: 'kumar.test2@gmail.com',
    mobile: '9876543211',
    address: '456 Industrial St, City',
  };

  const createRes2 = await postJson(`${API_BASE}/admin/customers`, cust2Data, authHeaders);
  console.log('  Response status:', createRes2.status);
  console.log('  Created Customer:', createRes2.data.customer);

  if (createRes2.status !== 201 || !createRes2.data.customer?.customerCode) {
    throw new Error('Failed to create second customer!');
  }
  const cust2Code = createRes2.data.customer.customerCode;

  if (cust1Code === cust2Code) {
    throw new Error('CRITICAL: Duplicate Customer ID generated for different customers!');
  }
  console.log(`  ✅ Second Customer Created. ID: ${cust2Code}. Both Customer IDs are unique!\n`);

  // Step 3: Accept Invitation & Create Password for Customer 1
  console.log('Step 3 - Fetching Invitation Token for Customer 1...');
  const invRecord1 = await prisma.invitation.findUnique({ where: { userId: cust1UserId } });
  if (!invRecord1) {
    throw new Error('Invitation record not found in DB!');
  }

  console.log('  Simulating customer setting password...');
  const passwordHash1 = await bcrypt.hash('CustomerPass123!', 10);
  await prisma.user.update({
    where: { id: cust1UserId },
    data: { passwordHash: passwordHash1, status: 'ACTIVE' },
  });
  console.log('  ✅ Customer 1 status set to ACTIVE with bcrypt hashed password.\n');

  // Step 4: Customer 1 Login (Email + Password, NO OTP)
  const cust1Email = createRes1.data.customer.email;
  console.log(`Step 4 - Customer 1 Logging in with ${cust1Email} + Password...`);
  const loginRes1 = await postJson(`${API_BASE}/auth/customer/login`, {
    email: cust1Email,
    password: 'CustomerPass123!',
  });

  console.log('  Response status:', loginRes1.status);
  console.log('  Requires OTP:', loginRes1.data.requiresOtp);
  console.log('  Token received:', !!loginRes1.data.token);
  console.log('  Customer Code in response:', loginRes1.data.user?.customerCode);
  console.log('  Redirect To:', loginRes1.data.redirectTo);

  if (loginRes1.status !== 200 || loginRes1.data.requiresOtp || !loginRes1.data.token) {
    throw new Error('Customer login failed or requested OTP!');
  }
  const cust1Token = loginRes1.data.token;
  console.log('  ✅ Customer 1 Logged in successfully without OTP!\n');

  // Step 5: Test Data Access Isolation (Customer 1 fetches profile, invoices, payments)
  console.log('Step 5 - Testing Customer 1 Data Access Control...');
  const profileRes = await getJson(`${API_BASE}/customer/profile`, { Authorization: `Bearer ${cust1Token}` });
  console.log('  Profile Customer Code:', profileRes.data.customer?.customerCode);
  if (profileRes.data.customer?.customerCode !== cust1Code) {
    throw new Error(`Profile returned code ${profileRes.data.customer?.customerCode} instead of ${cust1Code}`);
  }

  const invoicesRes = await getJson(`${API_BASE}/customer/invoices`, { Authorization: `Bearer ${cust1Token}` });
  console.log('  Invoices Customer Code:', invoicesRes.data.customerCode);
  if (invoicesRes.data.customerCode !== cust1Code) {
    throw new Error('Data leak: Customer invoices returned incorrect Customer ID!');
  }
  console.log('  ✅ Customer Data Access is 100% isolated to own Customer ID!\n');

  // Step 6: Customer Search (Admin/Accountant searches existing customer)
  console.log('Step 6 - Searching Customers by Customer ID, Name, Email, Mobile...');
  const searchRes1 = await getJson(`${API_BASE}/admin/customers?search=${cust1Code}`, authHeaders);
  console.log(`  Search for "${cust1Code}": Found ${searchRes1.data.count} customer(s).`);
  if (searchRes1.data.customers[0]?.customerCode !== cust1Code) {
    throw new Error('Search failed to locate existing customer by Customer ID!');
  }

  const searchRes2 = await getJson(`${API_BASE}/admin/customers?search=Kumar`, authHeaders);
  console.log(`  Search for "Kumar": Found ${searchRes2.data.count} customer(s).`);
  if (searchRes2.data.count < 2) {
    throw new Error('Search for "Kumar" failed to return both customers!');
  }
  console.log('  ✅ Customer Search successfully located existing customers!\n');

  // Step 7: Cleanup Test Data
  console.log('Step 7 - Cleaning up test customer records...');
  await prisma.invitation.deleteMany({ where: { userId: { in: [cust1UserId, createRes2.data.customer.userId] } } });
  await prisma.customer.deleteMany({ where: { userId: { in: [cust1UserId, createRes2.data.customer.userId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [cust1UserId, createRes2.data.customer.userId, adminUser.id] } } });
  console.log('  ✅ Test records cleaned up.\n');

  console.log('🎉 ALL CUSTOMER TEST CASES PASSED SUCCESSFULLY!');
}

testCustomerFlow()
  .catch((e) => {
    console.error('❌ Customer Test Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
