const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const nimesh = await prisma.contact.findFirst({ where: { name: { contains: 'Nimesh', mode: 'insensitive' } } });
  const azure = await prisma.contact.findFirst({ where: { name: { contains: 'Azure', mode: 'insensitive' } } });
  const officeChair = await prisma.product.findFirst({ where: { name: { contains: 'Office Chair', mode: 'insensitive' } } });
  const woodenChair = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Chair', mode: 'insensitive' } } });
  console.log('Nimesh:', nimesh?.name, 'type:', nimesh?.type, 'id:', nimesh?.id);
  console.log('Azure:', azure?.name, 'type:', azure?.type, 'id:', azure?.id);
  console.log('Office Chair:', officeChair?.name, 'salesPrice:', officeChair?.salesPrice, 'id:', officeChair?.id);
  console.log('Wooden Chair:', woodenChair?.name, 'costPrice:', woodenChair?.costPrice, 'id:', woodenChair?.id);
  await prisma.$disconnect();
}

check().catch(console.error);
