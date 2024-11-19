import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const insuranceCompanies = [
    { name: 'PAMI', code: '0001' },
    { name: 'OSDE', code: '0002' },
    { name: 'IOMA', code: '0003' },
    { name: 'OSUTHGRA', code: '0004' },
    { name: 'Swiss Medical', code: '0005' },
  ];

  for (const insuranceCompany of insuranceCompanies) {
    await prisma.insuranceCompany.upsert({
      where: { code: insuranceCompany.code },
      update: {
        name: insuranceCompany.name,
      },
      create: insuranceCompany,
    });
  }

  console.log('Obras sociales insertadas exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
