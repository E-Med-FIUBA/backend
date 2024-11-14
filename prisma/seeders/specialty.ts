// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const specialties = [
        { name: "Alergia e Inmunología" },
        { name: "Anatomía Patológica" },
        { name: "Anestesiología" },
        { name: "Cardiología" },
        { name: "Cardiología Infantil" },
        { name: "Cirugía Cardiovascular" },
        { name: "Cirugía General" },
        { name: "Cirugía Infantil" },
        { name: "Cirugía Plástica y Reparadora" },
        { name: "Cirugía Torácica" },
        { name: "Cirugía Vascular Periférica" },
        { name: "Clínica Médica" },
        { name: "Dermatología" },
        { name: "Diagnóstico por Imágenes" },
        { name: "Endocrinología" },
        { name: "Endocrinología Infantil" },
        { name: "Epidemiología" },
        { name: "Fisiatría y Rehabilitación" },
        { name: "Gastroenterología" },
        { name: "Gastroenterología Infantil" },
        { name: "Genética Médica" },
        { name: "Geriatría" },
        { name: "Ginecología" },
        { name: "Hematología" },
        { name: "Hematología Pediátrica" },
        { name: "Infectología" },
        { name: "Infectología Infantil" },
        { name: "Medicina del Deporte" },
        { name: "Medicina del Trabajo" },
        { name: "Medicina Estética" },
        { name: "Medicina Familiar y General" },
        { name: "Medicina Forense" },
        { name: "Medicina General y de Familia" },
        { name: "Medicina Interna" },
        { name: "Medicina Legal" },
        { name: "Medicina Nuclear" },
        { name: "Medicina Preventiva" },
        { name: "Nefrología" },
        { name: "Nefrología Infantil" },
        { name: "Neonatología" },
        { name: "Neumonología" },
        { name: "Neumonología Infantil" },
        { name: "Neurocirugía" },
        { name: "Neurología" },
        { name: "Neurología Infantil" },
        { name: "Nutrición" },
        { name: "Obstetricia" },
        { name: "Oftalmología" },
        { name: "Oncología" },
        { name: "Oncología Infantil" },
        { name: "Ortopedia y Traumatología" },
        { name: "Otorrinolaringología" },
        { name: "Patología Clínica" },
        { name: "Pediatría" },
        { name: "Psiquiatría" },
        { name: "Psiquiatría Infantil y de la Adolescencia" },
        { name: "Radioterapia" },
        { name: "Reumatología" },
        { name: "Reumatología Infantil" },
        { name: "Salud Pública" },
        { name: "Terapia Intensiva" },
        { name: "Terapia Intensiva Infantil" },
        { name: "Toxicología" },
        { name: "Urología" }
    ];

    for (const specialty of specialties) {
        await prisma.specialty.upsert({
            where: { name: specialty.name },
            update: specialty,
            create: specialty
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
