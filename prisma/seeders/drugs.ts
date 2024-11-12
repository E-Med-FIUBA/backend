import { PrismaClient } from '@prisma/client';
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

    const drugs = [];
    let isFirstLine = true;

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
            presentacion
        ] = line.split('\t');

        drugs.push({
            name: generic_name,
            administration: via,
            commercial_name: nombre_comercial,
            atc: atc,
            form: forma,
            description: '',
            presentations: {
                create: [
                    {
                        name: presentacion
                    }
                ]
            }
        });
    }

    for (const drug of drugs) {
        await prisma.drug.create({
            data: drug,
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