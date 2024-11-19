import { Drug, Presentation, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '..', 'data', 'drugs.tsv');
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const drugMap = new Map<
    string,
    Omit<Drug, 'id'> & { presentations: Omit<Presentation, 'id' | 'drugId'>[] }
  >();
  let isFirstLine = true;
  let i = 1;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip the header line
    }
    const [
      generic_name,
      _nombre_local,
      atc,
      forma,
      _laboratorio,
      via,
      _pais,
      nombre_comercial,
      presentacion,
    ] = line.split('\t');

    if (!drugMap.has(generic_name)) {
      drugMap.set(generic_name, {
        name: generic_name,
        atc: atc,
        description: '',
        presentations: [
          {
            name: presentacion,
            form: forma,
            administration: via,
            commercialName: nombre_comercial,
          },
        ],
      });
    }

    drugMap.get(generic_name).presentations.push({
      name: presentacion,
      form: forma,
      administration: via,
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
        id: i,
        ...drug,
        presentations: {
          create: drug.presentations,
        },
      },
      where: {
        name: drug.name,
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
                drugId: i,
              },
            },
            update: presentation,
          })),
        },
      },
    });

    i++;
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
