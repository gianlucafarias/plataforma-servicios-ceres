/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const GROUPS = [
  { id: 'oficios', name: 'Oficios', slug: 'oficios' },
  { id: 'profesiones', name: 'Profesiones', slug: 'profesiones' },
];

// Subcategorías de Oficios (copiadas de src/lib/taxonomy.ts)
const SUBCATEGORIES_OFICIOS = [
  // Construcción y mantenimiento
  { name: 'Plomero/a', slug: 'plomero', group: 'oficios' },
  { name: 'Electricista', slug: 'electricista', group: 'oficios' },
  { name: 'Albañil', slug: 'albanil', group: 'oficios' },
  { name: 'Gasista', slug: 'gasista', group: 'oficios' },
  { name: 'Pintor de obra', slug: 'pintor-obra', group: 'oficios' },
  { name: 'Carpintero/a', slug: 'carpintero', group: 'oficios' },
  { name: 'Herrero/a', slug: 'herrero', group: 'oficios' },
  { name: 'Yesero', slug: 'yesero', group: 'oficios' },
  { name: 'Techista', slug: 'techista', group: 'oficios' },
  // Climatización
  { name: 'Técnico en aires acondicionados', slug: 'tecnico-aires', group: 'oficios' },
  { name: 'Refrigeración comercial y hogareña', slug: 'refrigeracion', group: 'oficios' },
  // Servicios técnicos electrónicos
  { name: 'Reparador de electrodomésticos', slug: 'reparador-electrodomesticos', group: 'oficios' },
  { name: 'Técnico en celulares y tablets', slug: 'tecnico-celulares', group: 'oficios' },
  // Automotores
  { name: 'Mecánico automotriz', slug: 'mecanico-automotriz', group: 'oficios' },
  { name: 'Mecánico de motos', slug: 'mecanico-motos', group: 'oficios' },
  { name: 'Chapista', slug: 'chapista', group: 'oficios' },
  { name: 'Gomería', slug: 'gomero', group: 'oficios' },
  // Jardinería
  { name: 'Jardinero/a', slug: 'jardinero', group: 'oficios' },
  { name: 'Paisajista', slug: 'paisajista', group: 'oficios' },
  // Cocina
  { name: 'Pastelería', slug: 'pasteleria', group: 'oficios' },
  { name: 'Panificados', slug: 'panificados', group: 'oficios' },
  // Cuidados
  { name: 'Promotores gerontológicos', slug: 'promotores-gerontologicos', group: 'oficios' },
  { name: 'Niñera', slug: 'ninera', group: 'oficios' },
  // Fletes y mudanzas
  { name: 'Fletes y mudanzas', slug: 'fletes-mudanzas', group: 'oficios' },
  // Limpieza
  { name: 'Limpieza', slug: 'limpieza', group: 'oficios' },
  // Cerrajería
  { name: 'Cerrajeros', slug: 'cerrajero', group: 'oficios' },
  // Costura
  { name: 'Costurera', slug: 'costurera', group: 'oficios' },
];

// Subcategorías de Profesiones (copiadas de src/lib/taxonomy.ts)
const SUBCATEGORIES_PROFESIONES = [
  { name: 'Enfermería', slug: 'enfermeria', group: 'profesiones' },
  { name: 'Arquitectura', slug: 'arquitectura', group: 'profesiones' },
  { name: 'Marketing', slug: 'marketing', group: 'profesiones' },
  { name: 'Abogacía', slug: 'abogacia', group: 'profesiones' },
  { name: 'Contaduría', slug: 'contaduria', group: 'profesiones' },
  { name: 'Entrenadores físicos', slug: 'entrenadores-fisicos', group: 'profesiones' },
];

async function main() {
  console.log('Seedeando CategoryGroup...');
  for (const g of GROUPS) {
    await prisma.categoryGroup.upsert({
      where: { id: g.id },
      update: { name: g.name, slug: g.slug },
      create: { id: g.id, name: g.name, slug: g.slug },
    });
  }

  console.log('Seedeando Category (oficios)...');
  for (const c of SUBCATEGORIES_OFICIOS) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.name, active: true, groupId: c.group },
      create: { name: c.name, description: c.name, slug: c.slug, active: true, groupId: c.group },
    });
  }

  console.log('Seedeando Category (profesiones)...');
  for (const c of SUBCATEGORIES_PROFESIONES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.name, active: true, groupId: c.group },
      create: { name: c.name, description: c.name, slug: c.slug, active: true, groupId: c.group },
    });
  }

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


