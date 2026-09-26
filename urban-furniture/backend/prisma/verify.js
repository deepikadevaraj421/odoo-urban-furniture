const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function verify() {
  const az = await p.contact.findFirst({ where: { name: 'Azure Furniture' } });
  const np = await p.contact.findFirst({ where: { name: 'Nimesh Pathak' } });
  const wc = await p.product.findFirst({ where: { name: 'Wooden Chair' } });
  const oc = await p.product.findFirst({ where: { name: 'Office Chair' } });

  console.log('Azure Furniture:', az ? `OK - type=${az.type}` : 'MISSING');
  console.log('Nimesh Pathak:', np ? `OK - type=${np.type}` : 'MISSING');
  console.log('Wooden Chair:', wc ? `OK - price=Rs.${wc.salesPrice}` : 'MISSING');
  console.log('Office Chair:', oc ? `OK - price=Rs.${oc.salesPrice}` : 'MISSING');
  await p.$disconnect();
}
verify();
