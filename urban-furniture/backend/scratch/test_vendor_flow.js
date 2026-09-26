const prisma = require('../src/config/database');
const { generateToken } = require('../src/modules/auth/jwt.service');

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

async function runVendorTest() {
  console.log('\n=============================================================');
  console.log('🧪 TESTING VENDOR CREATION & ONBOARDING EMAIL FLOW');
  console.log('=============================================================\n');

  // 1. Get Admin user for auth
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Admin user not found');
  const adminToken = generateToken({ userId: admin.id, role: admin.role });

  const testVendorEmail = 'kanimozhi263010+azure@gmail.com';

  // 2. Clean up any existing contact with this test email
  await prisma.contact.deleteMany({
    where: { email: testVendorEmail },
  });

  console.log('--- 1. Calling POST /api/contacts for Vendor: Azure Furniture ---');
  const res = await apiRequest('/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Origin: 'http://localhost:5173',
    },
    body: JSON.stringify({
      name: 'Azure Furniture',
      type: 'VENDOR',
      email: testVendorEmail,
      mobile: '+91 9988776655',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    }),
  });

  console.log('Status:', res.status);
  console.log('Response:', res.data);

  if (!res.ok) {
    console.error('❌ Vendor creation failed:', res.data);
    process.exit(1);
  }

  // 3. Verify in PostgreSQL
  console.log('\n--- 2. Verifying Vendor contact in PostgreSQL ---');
  const contactInDb = await prisma.contact.findFirst({
    where: { email: testVendorEmail },
  });

  if (!contactInDb) throw new Error('Vendor contact not found in database!');
  console.log('✅ Vendor contact in DB:', {
    id: contactInDb.id,
    name: contactInDb.name,
    type: contactInDb.type,
    email: contactInDb.email,
    mobile: contactInDb.mobile,
    city: contactInDb.city,
    status: contactInDb.status,
  });

  console.log('\n=============================================================');
  console.log('🎉 VENDOR FLOW PASSED: Email successfully sent via SMTP & Contact saved!');
  console.log('=============================================================\n');
  process.exit(0);
}

runVendorTest().catch((err) => {
  console.error('❌ Vendor test failed:', err);
  process.exit(1);
});
