const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
async function upsertContact(data) {
  // Unique by name (so re-runs don't duplicate)
  const existing = await prisma.contact.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.contact.create({ data });
}

async function upsertProduct(name, data) {
  const existing = await prisma.product.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.product.create({ data: { name, ...data } });
}

async function upsertAccount(code, data) {
  return prisma.account.upsert({ where: { code }, update: {}, create: { code, ...data } });
}

async function upsertJournal(code, data) {
  return prisma.journal.upsert({ where: { code }, update: {}, create: { code, ...data } });
}

async function upsertAnalytic(code, data) {
  return prisma.analyticAccount.upsert({ where: { code }, update: {}, create: { code, ...data } });
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Urban Furniture ERP — Master Data Seed\n');

  // ══════════════════════════════════════════
  // 1. CHART OF ACCOUNTS — 50 records
  // ══════════════════════════════════════════
  console.log('📒 Seeding Chart of Accounts (50)...');
  const accounts = [
    // ASSET
    { code: 'A001', name: 'Cash in Hand',                type: 'ASSET',     balance: 50000 },
    { code: 'A002', name: 'Bank Account - HDFC',         type: 'ASSET',     balance: 500000 },
    { code: 'A003', name: 'Bank Account - SBI',          type: 'ASSET',     balance: 250000 },
    { code: 'A004', name: 'Accounts Receivable',         type: 'ASSET',     balance: 120000 },
    { code: 'A005', name: 'Furniture Inventory',         type: 'ASSET',     balance: 800000 },
    { code: 'A006', name: 'Raw Material Stock',          type: 'ASSET',     balance: 200000 },
    { code: 'A007', name: 'Prepaid Expenses',            type: 'ASSET',     balance: 30000  },
    { code: 'A008', name: 'Office Equipment',            type: 'ASSET',     balance: 150000 },
    { code: 'A009', name: 'Showroom Fixtures',           type: 'ASSET',     balance: 300000 },
    { code: 'A010', name: 'Petty Cash',                  type: 'ASSET',     balance: 10000  },
    // LIABILITY
    { code: 'L001', name: 'Accounts Payable',            type: 'LIABILITY', balance: 0 },
    { code: 'L002', name: 'Creditors - Vendors',         type: 'LIABILITY', balance: 0 },
    { code: 'L003', name: 'Bank Loan',                   type: 'LIABILITY', balance: 500000 },
    { code: 'L004', name: 'GST Payable',                 type: 'LIABILITY', balance: 0 },
    { code: 'L005', name: 'TDS Payable',                 type: 'LIABILITY', balance: 0 },
    { code: 'L006', name: 'Salary Payable',              type: 'LIABILITY', balance: 0 },
    { code: 'L007', name: 'Advance from Customers',      type: 'LIABILITY', balance: 0 },
    { code: 'L008', name: 'Rent Payable',                type: 'LIABILITY', balance: 0 },
    { code: 'L009', name: 'Outstanding Expenses',        type: 'LIABILITY', balance: 0 },
    { code: 'L010', name: 'Short-Term Borrowings',       type: 'LIABILITY', balance: 0 },
    // CAPITAL
    { code: 'C001', name: 'Capital Account',             type: 'CAPITAL',   balance: 1000000 },
    { code: 'C002', name: 'Retained Earnings',           type: 'CAPITAL',   balance: 0 },
    { code: 'C003', name: 'Owner\'s Drawings',           type: 'CAPITAL',   balance: 0 },
    { code: 'C004', name: 'General Reserve',             type: 'CAPITAL',   balance: 0 },
    { code: 'C005', name: 'Profit & Loss Account',       type: 'CAPITAL',   balance: 0 },
    // INCOME
    { code: 'I001', name: 'Sales Income - Furniture',    type: 'INCOME',    balance: 0 },
    { code: 'I002', name: 'Sales Income - Accessories',  type: 'INCOME',    balance: 0 },
    { code: 'I003', name: 'Service Revenue',             type: 'INCOME',    balance: 0 },
    { code: 'I004', name: 'Discount Received',           type: 'INCOME',    balance: 0 },
    { code: 'I005', name: 'Interest Income',             type: 'INCOME',    balance: 0 },
    { code: 'I006', name: 'Export Income',               type: 'INCOME',    balance: 0 },
    { code: 'I007', name: 'Rental Income',               type: 'INCOME',    balance: 0 },
    { code: 'I008', name: 'Other Income',                type: 'INCOME',    balance: 0 },
    { code: 'I009', name: 'Commission Income',           type: 'INCOME',    balance: 0 },
    { code: 'I010', name: 'Bulk Order Income',           type: 'INCOME',    balance: 0 },
    // EXPENSE
    { code: 'E001', name: 'Purchase Expense - Goods',    type: 'EXPENSE',   balance: 0 },
    { code: 'E002', name: 'Salary Expense',              type: 'EXPENSE',   balance: 0 },
    { code: 'E003', name: 'Rent Expense',                type: 'EXPENSE',   balance: 0 },
    { code: 'E004', name: 'Electricity Expense',         type: 'EXPENSE',   balance: 0 },
    { code: 'E005', name: 'Transport & Delivery Expense',type: 'EXPENSE',   balance: 0 },
    { code: 'E006', name: 'Office Expense',              type: 'EXPENSE',   balance: 0 },
    { code: 'E007', name: 'Marketing & Advertising',     type: 'EXPENSE',   balance: 0 },
    { code: 'E008', name: 'Telephone & Internet',        type: 'EXPENSE',   balance: 0 },
    { code: 'E009', name: 'Depreciation Expense',        type: 'EXPENSE',   balance: 0 },
    { code: 'E010', name: 'Repairs & Maintenance',       type: 'EXPENSE',   balance: 0 },
    { code: 'E011', name: 'Raw Material Expense',        type: 'EXPENSE',   balance: 0 },
    { code: 'E012', name: 'Packing & Shipping Expense',  type: 'EXPENSE',   balance: 0 },
    { code: 'E013', name: 'Bank Charges',                type: 'EXPENSE',   balance: 0 },
    { code: 'E014', name: 'Professional Fees',           type: 'EXPENSE',   balance: 0 },
    { code: 'E015', name: 'Miscellaneous Expense',       type: 'EXPENSE',   balance: 0 },
  ];
  for (const acc of accounts) await upsertAccount(acc.code, acc);
  console.log(`  ✅ Chart of Accounts: ${accounts.length} records ready`);

  // ══════════════════════════════════════════
  // 2. JOURNALS — 20 records
  // ══════════════════════════════════════════
  console.log('📓 Seeding Journals (20)...');
  const journals = [
    { code: 'SAL',  name: 'Sales Journal',               type: 'SALES'    },
    { code: 'PUR',  name: 'Purchase Journal',             type: 'PURCHASE' },
    { code: 'BNK',  name: 'Bank Journal',                 type: 'BANK'     },
    { code: 'CSH',  name: 'Cash Journal',                 type: 'CASH'     },
    { code: 'GEN',  name: 'General Journal',              type: 'GENERAL'  },
    { code: 'EXP',  name: 'Expense Journal',              type: 'GENERAL'  },
    { code: 'PAY',  name: 'Payment Journal',              type: 'CASH'     },
    { code: 'REC',  name: 'Receipt Journal',              type: 'CASH'     },
    { code: 'INV',  name: 'Inventory Journal',            type: 'GENERAL'  },
    { code: 'SAL2', name: 'Retail Sales Journal',         type: 'SALES'    },
    { code: 'EXP2', name: 'Salary Journal',               type: 'GENERAL'  },
    { code: 'BNK2', name: 'Bank Transfer Journal',        type: 'BANK'     },
    { code: 'TAX',  name: 'Tax & GST Journal',            type: 'GENERAL'  },
    { code: 'DEP',  name: 'Depreciation Journal',         type: 'GENERAL'  },
    { code: 'ADJ',  name: 'Adjustment Journal',           type: 'GENERAL'  },
    { code: 'CSH2', name: 'Petty Cash Journal',           type: 'CASH'     },
    { code: 'PUR2', name: 'Import Purchase Journal',      type: 'PURCHASE' },
    { code: 'REC2', name: 'Advance Receipt Journal',      type: 'CASH'     },
    { code: 'REF',  name: 'Refund Journal',               type: 'GENERAL'  },
    { code: 'OPN',  name: 'Opening Balance Journal',      type: 'GENERAL'  },
  ];
  for (const j of journals) await upsertJournal(j.code, j);
  console.log(`  ✅ Journals: ${journals.length} records ready`);

  // ══════════════════════════════════════════
  // 3. ANALYTIC ACCOUNTS — 15 records
  // ══════════════════════════════════════════
  console.log('📊 Seeding Analytic Accounts (15)...');
  const analytics = [
    { code: 'AN01', name: 'Sales Department',       type: 'Income'   },
    { code: 'AN02', name: 'Purchase Department',    type: 'Expenses' },
    { code: 'AN03', name: 'Manufacturing',          type: 'Expenses' },
    { code: 'AN04', name: 'Chennai Showroom',       type: 'Income'   },
    { code: 'AN05', name: 'Bangalore Showroom',     type: 'Income'   },
    { code: 'AN06', name: 'Coimbatore Branch',      type: 'Income'   },
    { code: 'AN07', name: 'Marketing Division',     type: 'Expenses' },
    { code: 'AN08', name: 'Administration',         type: 'Expenses' },
    { code: 'AN09', name: 'Warehouse & Logistics',  type: 'Expenses' },
    { code: 'AN10', name: 'Export Division',        type: 'Income'   },
    { code: 'AN11', name: 'Online Sales Channel',   type: 'Income'   },
    { code: 'AN12', name: 'Retail Outlet',          type: 'Income'   },
    { code: 'AN13', name: 'Corporate Sales',        type: 'Income'   },
    { code: 'AN14', name: 'Research & Development', type: 'Expenses' },
    { code: 'AN15', name: 'Customer Service',       type: 'Expenses' },
  ];
  const analyticMap = {};
  for (const a of analytics) {
    const rec = await upsertAnalytic(a.code, a);
    analyticMap[a.code] = rec.id;
  }
  console.log(`  ✅ Analytic Accounts: ${analytics.length} records ready`);

  // ══════════════════════════════════════════
  // 4. BUDGETS — 15 records
  // ══════════════════════════════════════════
  console.log('💰 Seeding Budgets (15)...');
  const budgetDefs = [
    { name: 'Annual Sales Budget 2026',       period: '2026',    plannedAmount: 5000000, responsible: 'Sales Manager',       analyticCode: 'AN01' },
    { name: 'Q1 Marketing Budget',            period: 'Q1 2026', plannedAmount: 300000,  responsible: 'Marketing Head',      analyticCode: 'AN07' },
    { name: 'Chennai Showroom Budget',        period: '2026',    plannedAmount: 1500000, responsible: 'Showroom Manager',    analyticCode: 'AN04' },
    { name: 'Bangalore Showroom Budget',      period: '2026',    plannedAmount: 1200000, responsible: 'Branch Manager',      analyticCode: 'AN05' },
    { name: 'Annual Purchase Budget',         period: '2026',    plannedAmount: 3000000, responsible: 'Purchase Manager',    analyticCode: 'AN02' },
    { name: 'Warehouse Operations Budget',    period: '2026',    plannedAmount: 600000,  responsible: 'Warehouse Head',      analyticCode: 'AN09' },
    { name: 'Administration Budget Q1',       period: 'Q1 2026', plannedAmount: 200000,  responsible: 'Admin Manager',       analyticCode: 'AN08' },
    { name: 'Manufacturing Budget 2026',      period: '2026',    plannedAmount: 2000000, responsible: 'Production Manager',  analyticCode: 'AN03' },
    { name: 'Export Division Budget',         period: '2026',    plannedAmount: 800000,  responsible: 'Export Head',         analyticCode: 'AN10' },
    { name: 'Online Sales Budget 2026',       period: '2026',    plannedAmount: 900000,  responsible: 'Digital Manager',     analyticCode: 'AN11' },
    { name: 'Corporate Sales Budget',         period: '2026',    plannedAmount: 2500000, responsible: 'Corporate Head',      analyticCode: 'AN13' },
    { name: 'Coimbatore Branch Budget',       period: '2026',    plannedAmount: 700000,  responsible: 'Branch Coordinator',  analyticCode: 'AN06' },
    { name: 'Customer Service Budget',        period: '2026',    plannedAmount: 150000,  responsible: 'CS Manager',          analyticCode: 'AN15' },
    { name: 'R&D Budget 2026',                period: '2026',    plannedAmount: 400000,  responsible: 'R&D Head',            analyticCode: 'AN14' },
    { name: 'Retail Outlet Budget',           period: '2026',    plannedAmount: 1100000, responsible: 'Retail Manager',      analyticCode: 'AN12' },
  ];
  for (const b of budgetDefs) {
    const existing = await prisma.budget.findFirst({ where: { name: b.name } });
    if (!existing) {
      await prisma.budget.create({
        data: {
          name:           b.name,
          period:         b.period,
          plannedAmount:  b.plannedAmount,
          responsible:    b.responsible,
          status:         'ACTIVE',
          analyticAccountId: analyticMap[b.analyticCode] || null,
        },
      });
    }
  }
  console.log(`  ✅ Budgets: ${budgetDefs.length} records ready`);

  // ══════════════════════════════════════════
  // 5. CONTACTS — 100 records
  // ══════════════════════════════════════════
  console.log('👥 Seeding Contacts (100)...');
  const contactData = [
    // ── Critical demo contacts (must exist first) ──────────
    { name: 'Azure Furniture',             type: 'VENDOR',   email: 'contact@azurefurniture.in',       mobile: '9840011234', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600001' },
    { name: 'Nimesh Pathak',               type: 'CUSTOMER', email: 'nimesh.pathak@gmail.com',         mobile: '9876543210', city: 'Mumbai',      state: 'Maharashtra', pincode: '400001' },
    { name: 'Modern Interiors',            type: 'BOTH',     email: 'contact@moderninteriors.in',      mobile: '9845012345', city: 'Bangalore',   state: 'Karnataka',   pincode: '560001' },
    { name: 'Wooden Chair Co.',            type: 'VENDOR',   email: 'sales@woodenchair.in',            mobile: '9012345678', city: 'Coimbatore',  state: 'Tamil Nadu',  pincode: '641001' },

    // ── Customers ──────────────────────────────────────────
    { name: 'Rahul Sharma',                type: 'CUSTOMER', email: 'rahul.sharma@gmail.com',          mobile: '9811223344', city: 'Delhi',       state: 'Delhi',       pincode: '110001' },
    { name: 'Priya Mehta',                 type: 'CUSTOMER', email: 'priya.mehta@gmail.com',           mobile: '9922334455', city: 'Pune',        state: 'Maharashtra', pincode: '411001' },
    { name: 'Suresh Kumar',                type: 'CUSTOMER', email: 'suresh.kumar@outlook.com',        mobile: '9933445566', city: 'Bangalore',   state: 'Karnataka',   pincode: '560001' },
    { name: 'Anita Reddy',                 type: 'CUSTOMER', email: 'anita.reddy@gmail.com',           mobile: '9944556677', city: 'Hyderabad',   state: 'Telangana',   pincode: '500001' },
    { name: 'Vijay Krishnan',              type: 'CUSTOMER', email: 'vijay.krishnan@yahoo.com',        mobile: '9955667788', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600002' },
    { name: 'Deepa Nair',                  type: 'CUSTOMER', email: 'deepa.nair@gmail.com',            mobile: '9966778899', city: 'Kochi',       state: 'Kerala',      pincode: '682001' },
    { name: 'Arun Babu',                   type: 'CUSTOMER', email: 'arun.babu@hotmail.com',           mobile: '9900112233', city: 'Madurai',     state: 'Tamil Nadu',  pincode: '625001' },
    { name: 'Lakshmi Pillai',              type: 'CUSTOMER', email: 'lakshmi.pillai@gmail.com',        mobile: '9812345671', city: 'Trivandrum',  state: 'Kerala',      pincode: '695001' },
    { name: 'Sanjay Patel',                type: 'CUSTOMER', email: 'sanjay.patel@gmail.com',          mobile: '9823456782', city: 'Ahmedabad',   state: 'Gujarat',     pincode: '380001' },
    { name: 'Meena Iyer',                  type: 'CUSTOMER', email: 'meena.iyer@gmail.com',            mobile: '9834567893', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600003' },
    { name: 'Karthik Rajan',               type: 'CUSTOMER', email: 'karthik.rajan@gmail.com',         mobile: '9845678904', city: 'Coimbatore',  state: 'Tamil Nadu',  pincode: '641002' },
    { name: 'Pooja Gupta',                 type: 'CUSTOMER', email: 'pooja.gupta@gmail.com',           mobile: '9856789015', city: 'Jaipur',      state: 'Rajasthan',   pincode: '302001' },
    { name: 'Rajesh Verma',                type: 'CUSTOMER', email: 'rajesh.verma@yahoo.com',          mobile: '9867890126', city: 'Lucknow',     state: 'Uttar Pradesh', pincode: '226001' },
    { name: 'Sunitha Rao',                 type: 'CUSTOMER', email: 'sunitha.rao@gmail.com',           mobile: '9878901237', city: 'Vizag',       state: 'Andhra Pradesh', pincode: '530001' },
    { name: 'Mohan Deshpande',             type: 'CUSTOMER', email: 'mohan.deshpande@gmail.com',       mobile: '9889012348', city: 'Nagpur',      state: 'Maharashtra', pincode: '440001' },
    { name: 'Kavitha Subramanian',         type: 'CUSTOMER', email: 'kavitha.sub@gmail.com',           mobile: '9890123459', city: 'Salem',       state: 'Tamil Nadu',  pincode: '636001' },
    { name: 'Aditya Singh',                type: 'CUSTOMER', email: 'aditya.singh@gmail.com',          mobile: '9801234560', city: 'Chandigarh',  state: 'Punjab',      pincode: '160001' },
    { name: 'Nithya Balaji',               type: 'CUSTOMER', email: 'nithya.balaji@gmail.com',         mobile: '9712345671', city: 'Trichy',      state: 'Tamil Nadu',  pincode: '620001' },
    { name: 'Ramesh Chandra',              type: 'CUSTOMER', email: 'ramesh.chandra@gmail.com',        mobile: '9723456782', city: 'Patna',       state: 'Bihar',       pincode: '800001' },
    { name: 'Saranya Kumari',              type: 'CUSTOMER', email: 'saranya.kumari@gmail.com',        mobile: '9734567893', city: 'Madurai',     state: 'Tamil Nadu',  pincode: '625002' },
    { name: 'Amit Joshi',                  type: 'CUSTOMER', email: 'amit.joshi@gmail.com',            mobile: '9745678904', city: 'Indore',      state: 'Madhya Pradesh', pincode: '452001' },
    { name: 'Divya Chandran',              type: 'CUSTOMER', email: 'divya.chandran@gmail.com',        mobile: '9756789015', city: 'Ernakulam',   state: 'Kerala',      pincode: '682002' },
    { name: 'Gowri Shankar',               type: 'CUSTOMER', email: 'gowri.shankar@gmail.com',         mobile: '9767890126', city: 'Mysore',      state: 'Karnataka',   pincode: '570001' },
    { name: 'Harish Choudhary',            type: 'CUSTOMER', email: 'harish.choudhary@gmail.com',      mobile: '9778901237', city: 'Jodhpur',     state: 'Rajasthan',   pincode: '342001' },
    { name: 'Indira Venkatesh',            type: 'CUSTOMER', email: 'indira.venkatesh@gmail.com',      mobile: '9789012348', city: 'Vellore',     state: 'Tamil Nadu',  pincode: '632001' },
    { name: 'Jayanthi Gopal',             type: 'CUSTOMER', email: 'jayanthi.gopal@gmail.com',        mobile: '9790123459', city: 'Tirunelveli', state: 'Tamil Nadu',  pincode: '627001' },
    { name: 'Krishnamurthy Bhat',          type: 'CUSTOMER', email: 'krishna.bhat@gmail.com',          mobile: '9601234570', city: 'Mangalore',   state: 'Karnataka',   pincode: '575001' },
    { name: 'Lavanya Suresh',              type: 'CUSTOMER', email: 'lavanya.suresh@gmail.com',        mobile: '9612345681', city: 'Coimbatore',  state: 'Tamil Nadu',  pincode: '641003' },
    { name: 'Madhavan Pillai',             type: 'CUSTOMER', email: 'madhavan.pillai@gmail.com',       mobile: '9623456792', city: 'Palakkad',    state: 'Kerala',      pincode: '678001' },
    { name: 'Nalini Krishnaswamy',         type: 'CUSTOMER', email: 'nalini.krishnaswamy@gmail.com',   mobile: '9634567803', city: 'Pondicherry', state: 'Puducherry',  pincode: '605001' },
    { name: 'Om Prakash Agarwal',          type: 'CUSTOMER', email: 'om.agarwal@gmail.com',            mobile: '9645678914', city: 'Varanasi',    state: 'Uttar Pradesh', pincode: '221001' },
    { name: 'Parvathi Ramamurthy',         type: 'CUSTOMER', email: 'parvathi.r@gmail.com',            mobile: '9656789025', city: 'Kanchipuram', state: 'Tamil Nadu',  pincode: '631501' },
    { name: 'Rohit Malhotra',              type: 'CUSTOMER', email: 'rohit.malhotra@gmail.com',        mobile: '9667890136', city: 'Amritsar',    state: 'Punjab',      pincode: '143001' },
    { name: 'Shantha Muthu',               type: 'CUSTOMER', email: 'shantha.muthu@gmail.com',         mobile: '9678901247', city: 'Madurai',     state: 'Tamil Nadu',  pincode: '625003' },
    { name: 'Thilaga Devi',                type: 'CUSTOMER', email: 'thilaga.devi@gmail.com',          mobile: '9689012358', city: 'Thanjavur',   state: 'Tamil Nadu',  pincode: '613001' },
    { name: 'Uma Shankar Tiwari',          type: 'CUSTOMER', email: 'uma.tiwari@gmail.com',            mobile: '9690123469', city: 'Bhopal',      state: 'Madhya Pradesh', pincode: '462001' },
    { name: 'Vasantha Kumari',             type: 'CUSTOMER', email: 'vasantha.k@gmail.com',            mobile: '9501234580', city: 'Tirupur',     state: 'Tamil Nadu',  pincode: '641604' },

    // ── Vendors ────────────────────────────────────────────
    { name: 'Royal Home Interiors',        type: 'VENDOR',   email: 'sales@royalhome.in',              mobile: '4422334455', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600005' },
    { name: 'Modern Living Stores',        type: 'VENDOR',   email: 'info@modernliving.in',            mobile: '8044556677', city: 'Bangalore',   state: 'Karnataka',   pincode: '560002' },
    { name: 'Chennai Office Solutions',    type: 'VENDOR',   email: 'contact@chennaios.in',            mobile: '4422446688', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600004' },
    { name: 'Bangalore Furniture Hub',     type: 'VENDOR',   email: 'info@blfurniturehub.in',          mobile: '8033557799', city: 'Bangalore',   state: 'Karnataka',   pincode: '560003' },
    { name: 'Coimbatore Interiors',        type: 'VENDOR',   email: 'sales@cbeinteriors.com',          mobile: '4222334456', city: 'Coimbatore',  state: 'Tamil Nadu',  pincode: '641005' },
    { name: 'Madurai Furnishings',         type: 'VENDOR',   email: 'contact@mdurafurnish.in',         mobile: '4522334457', city: 'Madurai',     state: 'Tamil Nadu',  pincode: '625004' },
    { name: 'Priya Enterprises',           type: 'VENDOR',   email: 'priya.ent@gmail.com',             mobile: '9442334458', city: 'Erode',       state: 'Tamil Nadu',  pincode: '638001' },
    { name: 'Karnataka Wood Works',        type: 'VENDOR',   email: 'info@kawood.in',                  mobile: '8042334459', city: 'Bangalore',   state: 'Karnataka',   pincode: '560004' },
    { name: 'Sunrise Furniture Factory',   type: 'VENDOR',   email: 'info@sunrisefurniture.in',        mobile: '9344123456', city: 'Rajkot',      state: 'Gujarat',     pincode: '360001' },
    { name: 'Mumbai Modular Kitchens',     type: 'VENDOR',   email: 'sales@mumbaimodular.in',          mobile: '2222334461', city: 'Mumbai',      state: 'Maharashtra', pincode: '400002' },
    { name: 'Delhi Office Furnishers',     type: 'VENDOR',   email: 'info@delhioffice.in',             mobile: '1122334462', city: 'Delhi',       state: 'Delhi',       pincode: '110002' },
    { name: 'Kolkata Wood Crafts',         type: 'VENDOR',   email: 'info@kolkatawoodcraft.in',        mobile: '3322334463', city: 'Kolkata',     state: 'West Bengal', pincode: '700001' },
    { name: 'Kerala Rattan Works',         type: 'VENDOR',   email: 'sales@keralarattan.com',          mobile: '4812334464', city: 'Thrissur',    state: 'Kerala',      pincode: '680001' },
    { name: 'Hyderabad Plywood Mart',      type: 'VENDOR',   email: 'info@hydplywood.in',              mobile: '4022334465', city: 'Hyderabad',   state: 'Telangana',   pincode: '500002' },
    { name: 'Pune Hardware & Supplies',    type: 'VENDOR',   email: 'sales@punehardware.in',           mobile: '2022334466', city: 'Pune',        state: 'Maharashtra', pincode: '411002' },
    { name: 'Surat Textile & Cushions',    type: 'VENDOR',   email: 'info@surattextile.in',            mobile: '2612334467', city: 'Surat',       state: 'Gujarat',     pincode: '395001' },
    { name: 'Nagpur Timber Traders',       type: 'VENDOR',   email: 'contact@nagpurtimber.in',         mobile: '7122334468', city: 'Nagpur',      state: 'Maharashtra', pincode: '440002' },
    { name: 'Jaipur Handicrafts Pvt Ltd',  type: 'VENDOR',   email: 'info@jaipurhandicrafts.in',       mobile: '1412334469', city: 'Jaipur',      state: 'Rajasthan',   pincode: '302002' },
    { name: 'Kochi Teak Suppliers',        type: 'VENDOR',   email: 'info@kochiteak.in',               mobile: '4842334470', city: 'Kochi',       state: 'Kerala',      pincode: '682003' },
    { name: 'Trichy Industrial Supplies',  type: 'VENDOR',   email: 'sales@trichyindustrial.com',      mobile: '4312334471', city: 'Trichy',      state: 'Tamil Nadu',  pincode: '620002' },

    // ── BOTH (Customer + Vendor) ────────────────────────────
    { name: 'Metro Furniture Corporation', type: 'BOTH',     email: 'info@metrofurniture.in',          mobile: '9898223344', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600006' },
    { name: 'National Office Supplies',    type: 'BOTH',     email: 'info@nationaloffice.in',          mobile: '9797223345', city: 'Mumbai',      state: 'Maharashtra', pincode: '400003' },
    { name: 'South India Furniture',       type: 'BOTH',     email: 'contact@southindiafurniture.com', mobile: '9696223346', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600007' },
    { name: 'Deccan Home Solutions',       type: 'BOTH',     email: 'info@deccanhomeliving.in',        mobile: '9595223347', city: 'Hyderabad',   state: 'Telangana',   pincode: '500003' },
    { name: 'Heritage Woodcraft India',    type: 'BOTH',     email: 'sales@heritagewood.in',           mobile: '9494223348', city: 'Mysore',      state: 'Karnataka',   pincode: '570002' },
    { name: 'Comfort Living Pvt Ltd',      type: 'BOTH',     email: 'contact@comfortliving.in',        mobile: '9393223349', city: 'Bangalore',   state: 'Karnataka',   pincode: '560005' },
    { name: 'Ashoka Furniture Works',      type: 'BOTH',     email: 'info@ashokafurniture.in',         mobile: '9292223350', city: 'Coimbatore',  state: 'Tamil Nadu',  pincode: '641006' },
    { name: 'Premier Interiors Pvt Ltd',   type: 'BOTH',     email: 'contact@premierinteriors.in',     mobile: '9191223351', city: 'Pune',        state: 'Maharashtra', pincode: '411003' },
    { name: 'Classic Furnishings Ltd',     type: 'BOTH',     email: 'info@classicfurnishings.in',      mobile: '9090223352', city: 'Delhi',       state: 'Delhi',       pincode: '110003' },
    { name: 'GreenLeaf Furniture Studio',  type: 'BOTH',     email: 'hello@greenleaffurniture.in',     mobile: '8989223353', city: 'Bangalore',   state: 'Karnataka',   pincode: '560006' },

    // ── More customers (to reach 100 total) ────────────────
    { name: 'Babu Natarajan',              type: 'CUSTOMER', email: 'babu.natarajan@gmail.com',        mobile: '9512341001', city: 'Salem',       state: 'Tamil Nadu',  pincode: '636002' },
    { name: 'Charulatha Bose',             type: 'CUSTOMER', email: 'charulatha.bose@gmail.com',       mobile: '9512341002', city: 'Kolkata',     state: 'West Bengal', pincode: '700002' },
    { name: 'Dinesh Raj',                  type: 'CUSTOMER', email: 'dinesh.raj@gmail.com',            mobile: '9512341003', city: 'Trichy',      state: 'Tamil Nadu',  pincode: '620003' },
    { name: 'Ezhilarasi Velu',             type: 'CUSTOMER', email: 'ezhilarasi.v@gmail.com',          mobile: '9512341004', city: 'Tirunelveli', state: 'Tamil Nadu',  pincode: '627002' },
    { name: 'Fathima Begum',               type: 'CUSTOMER', email: 'fathima.begum@gmail.com',         mobile: '9512341005', city: 'Calicut',     state: 'Kerala',      pincode: '673001' },
    { name: 'Ganesh Moorthy',              type: 'CUSTOMER', email: 'ganesh.moorthy@gmail.com',        mobile: '9512341006', city: 'Erode',       state: 'Tamil Nadu',  pincode: '638002' },
    { name: 'Hema Chandrasekhar',          type: 'CUSTOMER', email: 'hema.chandra@gmail.com',          mobile: '9512341007', city: 'Vellore',     state: 'Tamil Nadu',  pincode: '632002' },
    { name: 'Ilangovan Sekar',             type: 'CUSTOMER', email: 'ilangovan.sekar@gmail.com',       mobile: '9512341008', city: 'Cuddalore',   state: 'Tamil Nadu',  pincode: '607001' },
    { name: 'Janaki Narayanan',            type: 'CUSTOMER', email: 'janaki.narayanan@gmail.com',      mobile: '9512341009', city: 'Villupuram',  state: 'Tamil Nadu',  pincode: '605602' },
    { name: 'Kamalakannan Muthu',          type: 'CUSTOMER', email: 'kamalakannan@gmail.com',          mobile: '9512341010', city: 'Dindigul',    state: 'Tamil Nadu',  pincode: '624001' },
    { name: 'Loganathan Arumugam',         type: 'CUSTOMER', email: 'logana.arumugam@gmail.com',       mobile: '9512341011', city: 'Pollachi',    state: 'Tamil Nadu',  pincode: '642001' },
    { name: 'Mythili Kannan',              type: 'CUSTOMER', email: 'mythili.kannan@gmail.com',        mobile: '9512341012', city: 'Karur',       state: 'Tamil Nadu',  pincode: '639001' },
    { name: 'Nandakumar Subbu',            type: 'CUSTOMER', email: 'nandakumar.subbu@gmail.com',      mobile: '9512341013', city: 'Ooty',        state: 'Tamil Nadu',  pincode: '643001' },
    { name: 'Oviya Ravi',                  type: 'CUSTOMER', email: 'oviya.ravi@gmail.com',            mobile: '9512341014', city: 'Hosur',       state: 'Tamil Nadu',  pincode: '635109' },
    { name: 'Periyasamy Gounder',          type: 'CUSTOMER', email: 'periyasamy.g@gmail.com',          mobile: '9512341015', city: 'Namakkal',    state: 'Tamil Nadu',  pincode: '637001' },
    { name: 'Rajalakshmi Iyer',            type: 'CUSTOMER', email: 'rajalakshmi.iyer@gmail.com',      mobile: '9512341016', city: 'Kumbakonam',  state: 'Tamil Nadu',  pincode: '612001' },
    { name: 'Soundararajan Nair',          type: 'CUSTOMER', email: 'soundararajan.n@gmail.com',       mobile: '9512341017', city: 'Nagercoil',   state: 'Tamil Nadu',  pincode: '629001' },
    { name: 'Thangamuthu Raja',            type: 'CUSTOMER', email: 'thangamuthu.r@gmail.com',         mobile: '9512341018', city: 'Sivakasi',    state: 'Tamil Nadu',  pincode: '626123' },
    { name: 'Umamaheswari Krishnan',       type: 'CUSTOMER', email: 'umamaheshwari.k@gmail.com',       mobile: '9512341019', city: 'Rajapalayam', state: 'Tamil Nadu',  pincode: '626117' },
    { name: 'Vinayagam Pillai',            type: 'CUSTOMER', email: 'vinayagam.p@gmail.com',           mobile: '9512341020', city: 'Tuticorin',   state: 'Tamil Nadu',  pincode: '628001' },
    { name: 'Welfare Office Furnishings',  type: 'CUSTOMER', email: 'procurement@welfare-office.in',   mobile: '4422886644', city: 'Chennai',     state: 'Tamil Nadu',  pincode: '600008' },
    { name: 'XYZ Corporate Solutions',     type: 'CUSTOMER', email: 'procurement@xyzcorp.in',          mobile: '2244668800', city: 'Mumbai',      state: 'Maharashtra', pincode: '400004' },
    { name: 'Young Designers Studio',      type: 'CUSTOMER', email: 'studio@youngdesign.in',           mobile: '8800442266', city: 'Pune',        state: 'Maharashtra', pincode: '411004' },
    { name: 'Zenith Interiors Pvt Ltd',    type: 'CUSTOMER', email: 'info@zenithinteriors.in',         mobile: '4433221100', city: 'Bangalore',   state: 'Karnataka',   pincode: '560007' },
  ];

  // Customer accounts are created through the Admin Customer Directory.
  for (const c of contactData.filter((contact) => contact.type !== 'CUSTOMER' && contact.type !== 'BOTH')) await upsertContact(c);
  console.log(`  ✅ Non-customer contacts: ${contactData.filter((contact) => contact.type !== 'CUSTOMER' && contact.type !== 'BOTH').length} records ready`);

  // ══════════════════════════════════════════
  // 6. PRODUCTS — 100 records
  // ══════════════════════════════════════════
  console.log('📦 Seeding Products (100)...');
  const products = [
    // Chairs
    { name: 'Office Chair',                    type: 'GOODS',   category: 'Chairs',       salesPrice: 8500,   costPrice: 5500  },
    { name: 'Executive Chair',                 type: 'GOODS',   category: 'Chairs',       salesPrice: 18000,  costPrice: 12000 },
    { name: 'Wooden Chair',                    type: 'GOODS',   category: 'Chairs',       salesPrice: 4500,   costPrice: 2800  },
    { name: 'Recliner',                        type: 'GOODS',   category: 'Chairs',       salesPrice: 25000,  costPrice: 17000 },
    { name: 'Dining Chair',                    type: 'GOODS',   category: 'Chairs',       salesPrice: 3800,   costPrice: 2200  },
    { name: 'Recliner Chair',                  type: 'GOODS',   category: 'Chairs',       salesPrice: 25000,  costPrice: 17000 },
    { name: 'Plastic Stacking Chair',          type: 'GOODS',   category: 'Chairs',       salesPrice: 1200,   costPrice: 700   },
    { name: 'Bar Stool',                       type: 'GOODS',   category: 'Chairs',       salesPrice: 3500,   costPrice: 2100  },
    { name: 'Lounge Chair',                    type: 'GOODS',   category: 'Chairs',       salesPrice: 22000,  costPrice: 15000 },
    { name: 'Visitor Chair',                   type: 'GOODS',   category: 'Chairs',       salesPrice: 5500,   costPrice: 3500  },
    { name: 'High Back Chair',                 type: 'GOODS',   category: 'Chairs',       salesPrice: 12000,  costPrice: 8000  },
    // Tables
    { name: 'Office Desk',                     type: 'GOODS',   category: 'Tables',       salesPrice: 15000,  costPrice: 9500  },
    { name: 'Dining Table',                    type: 'GOODS',   category: 'Tables',       salesPrice: 28000,  costPrice: 18000 },
    { name: 'Wooden Table',                    type: 'GOODS',   category: 'Tables',       salesPrice: 16000,  costPrice: 10000 },
    { name: 'Office Table',                    type: 'GOODS',   category: 'Tables',       salesPrice: 15000,  costPrice: 9500  },
    { name: 'Wooden Dining Table',             type: 'GOODS',   category: 'Tables',       salesPrice: 28000,  costPrice: 18000 },
    { name: 'Conference Table',                type: 'GOODS',   category: 'Tables',       salesPrice: 65000,  costPrice: 42000 },
    { name: 'Study Table',                     type: 'GOODS',   category: 'Tables',       salesPrice: 9500,   costPrice: 6000  },
    { name: 'Coffee Table',                    type: 'GOODS',   category: 'Tables',       salesPrice: 12000,  costPrice: 7500  },
    { name: 'Side Table',                      type: 'GOODS',   category: 'Tables',       salesPrice: 5000,   costPrice: 3000  },
    { name: 'Computer Desk',                   type: 'GOODS',   category: 'Tables',       salesPrice: 11000,  costPrice: 7000  },
    { name: 'Reception Desk',                  type: 'GOODS',   category: 'Tables',       salesPrice: 45000,  costPrice: 28000 },
    { name: 'L-Shaped Desk',                   type: 'GOODS',   category: 'Tables',       salesPrice: 22000,  costPrice: 14000 },
    { name: 'Glass Top Table',                 type: 'GOODS',   category: 'Tables',       salesPrice: 18000,  costPrice: 11000 },
    // Sofas
    { name: '3-Seater Sofa',                   type: 'GOODS',   category: 'Sofas',        salesPrice: 38000,  costPrice: 25000 },
    { name: '2-Seater Sofa',                   type: 'GOODS',   category: 'Sofas',        salesPrice: 28000,  costPrice: 18000 },
    { name: 'L-Shaped Sofa',                   type: 'GOODS',   category: 'Sofas',        salesPrice: 55000,  costPrice: 36000 },
    { name: 'Sofa Cum Bed',                     type: 'GOODS',   category: 'Sofas',        salesPrice: 32000,  costPrice: 21000 },
    { name: 'Ottoman',                          type: 'GOODS',   category: 'Sofas',        salesPrice: 8000,   costPrice: 5000  },
    { name: 'Sectional Sofa',                   type: 'GOODS',   category: 'Sofas',        salesPrice: 72000,  costPrice: 48000 },
    { name: 'Fabric Sofa',                      type: 'GOODS',   category: 'Sofas',        salesPrice: 35000,  costPrice: 23000 },
    { name: 'Leather Sofa',                     type: 'GOODS',   category: 'Sofas',        salesPrice: 65000,  costPrice: 44000 },
    // Beds
    { name: 'Bed',                             type: 'GOODS',   category: 'Beds',         salesPrice: 20000,  costPrice: 13000 },
    { name: 'King Size Bed',                   type: 'GOODS',   category: 'Beds',         salesPrice: 55000,  costPrice: 36000 },
    { name: 'Queen Size Bed',                  type: 'GOODS',   category: 'Beds',         salesPrice: 42000,  costPrice: 28000 },
    { name: 'Single Bed',                      type: 'GOODS',   category: 'Beds',         salesPrice: 22000,  costPrice: 14000 },
    { name: 'Bunk Bed',                        type: 'GOODS',   category: 'Beds',         salesPrice: 35000,  costPrice: 23000 },
    { name: 'Divan Bed',                       type: 'GOODS',   category: 'Beds',         salesPrice: 28000,  costPrice: 18000 },
    { name: 'Storage Bed',                     type: 'GOODS',   category: 'Beds',         salesPrice: 48000,  costPrice: 32000 },
    // Storage
    { name: 'Bookshelf',                       type: 'GOODS',   category: 'Storage',      salesPrice: 12000,  costPrice: 7500  },
    { name: 'Wardrobe',                        type: 'GOODS',   category: 'Storage',      salesPrice: 45000,  costPrice: 30000 },
    { name: 'Filing Cabinet',                  type: 'GOODS',   category: 'Storage',      salesPrice: 8500,   costPrice: 5500  },
    { name: 'Chest of Drawers',               type: 'GOODS',   category: 'Storage',      salesPrice: 18000,  costPrice: 12000 },
    { name: 'TV Unit',                         type: 'GOODS',   category: 'Storage',      salesPrice: 22000,  costPrice: 14000 },
    { name: 'Shoe Rack',                       type: 'GOODS',   category: 'Storage',      salesPrice: 5500,   costPrice: 3500  },
    { name: 'Corner Shelf',                    type: 'GOODS',   category: 'Storage',      salesPrice: 4500,   costPrice: 2800  },
    { name: 'Display Cabinet',                 type: 'GOODS',   category: 'Storage',      salesPrice: 32000,  costPrice: 21000 },
    // Office Furniture
    { name: 'Modular Workstation',             type: 'GOODS',   category: 'Office',       salesPrice: 35000,  costPrice: 23000 },
    { name: 'Training Table',                  type: 'GOODS',   category: 'Office',       salesPrice: 18000,  costPrice: 12000 },
    { name: 'Meeting Room Chair',              type: 'GOODS',   category: 'Office',       salesPrice: 7500,   costPrice: 5000  },
    { name: 'Ergonomic Chair',                 type: 'GOODS',   category: 'Office',       salesPrice: 15000,  costPrice: 10000 },
    { name: 'Podium',                          type: 'GOODS',   category: 'Office',       salesPrice: 12000,  costPrice: 8000  },
    { name: 'Cafeteria Table',                 type: 'GOODS',   category: 'Office',       salesPrice: 8000,   costPrice: 5200  },
    { name: 'Cafeteria Chair',                 type: 'GOODS',   category: 'Office',       salesPrice: 2800,   costPrice: 1700  },
    { name: 'Partition Screen',                type: 'GOODS',   category: 'Office',       salesPrice: 9500,   costPrice: 6000  },
    // Bedroom
    { name: 'Dressing Table',                  type: 'GOODS',   category: 'Bedroom',      salesPrice: 18000,  costPrice: 12000 },
    { name: 'Bedside Table',                   type: 'GOODS',   category: 'Bedroom',      salesPrice: 6500,   costPrice: 4000  },
    { name: 'Mattress - King',                 type: 'GOODS',   category: 'Bedroom',      salesPrice: 32000,  costPrice: 22000 },
    { name: 'Mattress - Queen',                type: 'GOODS',   category: 'Bedroom',      salesPrice: 24000,  costPrice: 16000 },
    { name: 'Mattress - Single',               type: 'GOODS',   category: 'Bedroom',      salesPrice: 12000,  costPrice: 8000  },
    // Outdoor
    { name: 'Garden Chair',                    type: 'GOODS',   category: 'Outdoor',      salesPrice: 3500,   costPrice: 2200  },
    { name: 'Garden Table',                    type: 'GOODS',   category: 'Outdoor',      salesPrice: 8000,   costPrice: 5200  },
    { name: 'Patio Set',                       type: 'GOODS',   category: 'Outdoor',      salesPrice: 25000,  costPrice: 17000 },
    { name: 'Swing Chair',                     type: 'GOODS',   category: 'Outdoor',      salesPrice: 18000,  costPrice: 12000 },
    { name: 'Hammock',                         type: 'GOODS',   category: 'Outdoor',      salesPrice: 5500,   costPrice: 3500  },
    // Accessories & Décor
    { name: 'Floor Lamp',                      type: 'GOODS',   category: 'Accessories',  salesPrice: 4500,   costPrice: 2800  },
    { name: 'Table Lamp',                      type: 'GOODS',   category: 'Accessories',  salesPrice: 2200,   costPrice: 1400  },
    { name: 'Wall Clock',                      type: 'GOODS',   category: 'Accessories',  salesPrice: 1800,   costPrice: 1100  },
    { name: 'Picture Frame Set',               type: 'GOODS',   category: 'Accessories',  salesPrice: 2500,   costPrice: 1600  },
    { name: 'Cushion Set (5 pcs)',             type: 'GOODS',   category: 'Accessories',  salesPrice: 3200,   costPrice: 2000  },
    { name: 'Area Rug',                        type: 'GOODS',   category: 'Accessories',  salesPrice: 8500,   costPrice: 5500  },
    { name: 'Curtain Set',                     type: 'GOODS',   category: 'Accessories',  salesPrice: 4800,   costPrice: 3000  },
    { name: 'Artificial Plant (Large)',        type: 'GOODS',   category: 'Accessories',  salesPrice: 3500,   costPrice: 2200  },
    { name: 'Decorative Vase',                 type: 'GOODS',   category: 'Accessories',  salesPrice: 1500,   costPrice: 900   },
    { name: 'Mirror - Full Length',            type: 'GOODS',   category: 'Accessories',  salesPrice: 6500,   costPrice: 4200  },
    // Combo Packages
    { name: 'Office Starter Pack',             type: 'COMBO',   category: 'Combos',       salesPrice: 55000,  costPrice: 36000 },
    { name: 'Home Office Bundle',              type: 'COMBO',   category: 'Combos',       salesPrice: 42000,  costPrice: 28000 },
    { name: 'Bedroom Set Complete',            type: 'COMBO',   category: 'Combos',       salesPrice: 120000, costPrice: 80000 },
    { name: 'Living Room Set',                 type: 'COMBO',   category: 'Combos',       salesPrice: 95000,  costPrice: 63000 },
    { name: 'Dining Set 6 Seater',             type: 'COMBO',   category: 'Combos',       salesPrice: 65000,  costPrice: 43000 },
    { name: 'Executive Suite Bundle',          type: 'COMBO',   category: 'Combos',       salesPrice: 150000, costPrice: 100000 },
    { name: 'Conference Room Package',         type: 'COMBO',   category: 'Combos',       salesPrice: 220000, costPrice: 145000 },
    { name: 'Kids Room Package',               type: 'COMBO',   category: 'Combos',       salesPrice: 48000,  costPrice: 32000 },
    // Services
    { name: 'Furniture Assembly Service',      type: 'SERVICE', category: 'Services',     salesPrice: 1500,   costPrice: 800   },
    { name: 'Home Delivery Service',           type: 'SERVICE', category: 'Services',     salesPrice: 800,    costPrice: 400   },
    { name: 'Interior Consultation',           type: 'SERVICE', category: 'Services',     salesPrice: 3500,   costPrice: 1500  },
    { name: 'Furniture Repair Service',        type: 'SERVICE', category: 'Services',     salesPrice: 2500,   costPrice: 1200  },
    { name: 'Upholstery Service',              type: 'SERVICE', category: 'Services',     salesPrice: 5000,   costPrice: 2500  },
    { name: 'Custom Furniture Design',         type: 'SERVICE', category: 'Services',     salesPrice: 15000,  costPrice: 8000  },
    { name: 'Polish & Refinish Service',       type: 'SERVICE', category: 'Services',     salesPrice: 3500,   costPrice: 1800  },
    { name: 'Annual Maintenance Contract',     type: 'SERVICE', category: 'Services',     salesPrice: 8000,   costPrice: 4000  },
    { name: 'Showroom Display Setup',          type: 'SERVICE', category: 'Services',     salesPrice: 25000,  costPrice: 15000 },
    // More Goods
    { name: 'Teak Wood Bench',                 type: 'GOODS',   category: 'Tables',       salesPrice: 22000,  costPrice: 14000 },
    { name: 'Folding Table',                   type: 'GOODS',   category: 'Tables',       salesPrice: 6500,   costPrice: 4200  },
    { name: 'Folding Chair',                   type: 'GOODS',   category: 'Chairs',       salesPrice: 1800,   costPrice: 1100  },
    { name: 'Bean Bag',                        type: 'GOODS',   category: 'Sofas',        salesPrice: 6000,   costPrice: 3800  },
    { name: 'Magazine Rack',                   type: 'GOODS',   category: 'Storage',      salesPrice: 2200,   costPrice: 1400  },
    { name: 'Puja Unit',                       type: 'GOODS',   category: 'Storage',      salesPrice: 15000,  costPrice: 9500  },
    { name: 'Crockery Unit',                   type: 'GOODS',   category: 'Storage',      salesPrice: 28000,  costPrice: 18000 },
    { name: 'Hallway Console Table',           type: 'GOODS',   category: 'Tables',       salesPrice: 12000,  costPrice: 7500  },
    { name: 'Coat Stand',                      type: 'GOODS',   category: 'Accessories',  salesPrice: 2800,   costPrice: 1700  },
    { name: 'Umbrella Stand',                  type: 'GOODS',   category: 'Accessories',  salesPrice: 1200,   costPrice: 700   },
    { name: 'Ironing Board',                   type: 'GOODS',   category: 'Accessories',  salesPrice: 2500,   costPrice: 1500  },
  ];

  for (const p of products) await upsertProduct(p.name, p);
  console.log(`  ✅ Products: ${products.length} records ready`);

  // ══════════════════════════════════════════
  // VERIFY COUNTS
  // ══════════════════════════════════════════
  console.log('\n📊 Verifying record counts...');
  const [cCount, pCount, aCount, jCount, anCount, bCount] = await Promise.all([
    prisma.contact.count(),
    prisma.product.count(),
    prisma.account.count(),
    prisma.journal.count(),
    prisma.analyticAccount.count(),
    prisma.budget.count(),
  ]);

  console.log(`\n  👥 Contacts:          ${cCount}`);
  console.log(`  📦 Products:          ${pCount}`);
  console.log(`  📒 Chart of Accounts: ${aCount}`);
  console.log(`  📓 Journals:          ${jCount}`);
  console.log(`  📊 Analytic Accounts: ${anCount}`);
  console.log(`  💰 Budgets:           ${bCount}`);
  console.log(`  ─────────────────────────────`);
  console.log(`  TOTAL:                ${cCount + pCount + aCount + jCount + anCount + bCount}`);
  console.log('\n✅ Seed complete!\n');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('\n❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
