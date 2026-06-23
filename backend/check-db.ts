import { prisma } from './src/config/database';

async function check() {
  const records = await prisma.farmRecord.findMany({
    include: {
      aiValidation: true,
      carbonScore: true,
      certificate: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(records, null, 2));
  await prisma.$disconnect();
}
check();
