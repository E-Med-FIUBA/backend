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

    const drugMap = new Map<string, Omit<Drug, 'id'> & { presentations: Omit<Presentation, 'id' | 'drugId'>[] }>();
    let isFirstLine = true;

    for await (const line of rl) {
        if (isFirstLine) {
            isFirstLine = false;
            continue; // Skip the header line
        }
        let [
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


        console.log(forma)
        console.log(via)

        forma = JSON.parse(forma.replace(/'/g, '"'));
        via = JSON.parse(via.replace(/'/g, '"'));


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
                        commercial_name: nombre_comercial,
                    }
                ]
            });
        }

        drugMap.get(generic_name).presentations.push({
            name: presentacion,
            form: forma,
            administration: via,
            commercial_name: nombre_comercial,
        });
    }

    for (const drug of drugMap.values()) {
        await prisma.drug.create({
            data: {
                ...drug,
                presentations: {
                    create: drug.presentations
                }
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