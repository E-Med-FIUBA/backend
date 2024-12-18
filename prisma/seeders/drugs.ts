import { Drug, Presentation, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '/../../../', 'prisma/data/drugs.tsv');
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const drugMap = new Map<
    string,
    Drug & { presentations: Omit<Presentation, 'id' | 'drugId'>[] }
  >();
  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip the header line
    }
    const [
      id,
      atc,
      _laboratorio,
      forma,
      _nombre_local,
      _pais,
      generic_name,
      via,
      nombre_comercial,
      presentacion,
    ] = line.split('\t');

    if (!drugMap.has(generic_name)) {
      drugMap.set(generic_name, {
        id: parseInt(id),
        name: generic_name,
        atc: atc,
        description: '',
        presentations: [
          {
            name: presentacion,
            form: forma.replaceAll(/[\[\]']/g, ''),
            administration: via.replaceAll(/[\[\]']/g, ''),
            commercialName: nombre_comercial,
          },
        ],
      });
    }

    drugMap.get(generic_name).presentations.push({
      name: presentacion,
      form: forma.replaceAll(/[\[\]']/g, ''),
      administration: via.replaceAll(/[\[\]']/g, ''),
      commercialName: nombre_comercial,
    });
  }

  for (const drug of drugMap.values()) {
    // Filter repeated presentations
    drug.presentations = drug.presentations.filter(
      (presentation, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.name === presentation.name &&
            t.administration === presentation.administration &&
            t.commercialName === presentation.commercialName,
        ),
    );

    await prisma.drug.upsert({
      create: {
        id: drug.id,
        ...drug,
        presentations: {
          create: drug.presentations,
        },
      },
      where: {
        id: drug.id,
      },
      update: {
        ...drug,
        presentations: {
          upsert: drug.presentations.map((presentation) => ({
            create: presentation,
            where: {
              name_administration_commercialName_drugId: {
                name: presentation.name,
                administration: presentation.administration,
                commercialName: presentation.commercialName,
                drugId: drug.id,
              },
            },
            update: presentation,
          })),
        },
      },
    });
  }

  console.log('Drugs seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
