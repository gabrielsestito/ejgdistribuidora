import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ejgdistribuidora.com' },
    update: {},
    create: {
      email: 'admin@ejgdistribuidora.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create driver user
  const driverPassword = await bcrypt.hash('driver123', 10)
  const driver = await prisma.user.upsert({
    where: { email: 'entregador@ejgdistribuidora.com' },
    update: {},
    create: {
      email: 'entregador@ejgdistribuidora.com',
      name: 'João Entregador',
      phone: '11999999999',
      password: driverPassword,
      role: 'DRIVER',
    },
  })
  console.log('✅ Driver user created:', driver.email)

  // Create categories
  const categoria1 = await prisma.category.upsert({
    where: { slug: 'cesta-basica-completa' },
    update: {},
    create: {
      name: 'Cesta Básica Completa',
      slug: 'cesta-basica-completa',
      description: 'Cestas básicas completas com todos os itens essenciais',
    },
  })

  const categoria2 = await prisma.category.upsert({
    where: { slug: 'cesta-premium' },
    update: {},
    create: {
      name: 'Cesta Premium',
      slug: 'cesta-premium',
      description: 'Cestas com produtos selecionados de alta qualidade',
    },
  })

  const categoria3 = await prisma.category.upsert({
    where: { slug: 'cesta-economica' },
    update: {},
    create: {
      name: 'Cesta Econômica',
      slug: 'cesta-economica',
      description: 'Cestas com melhor custo-benefício',
    },
  })

  console.log('✅ Categories created')

  // Create products
  const produtos = [
    {
      name: 'Cesta Básica Familiar',
      slug: 'cesta-basica-familiar',
      description: 'Cesta completa para uma família de até 4 pessoas. Inclui arroz, feijão, macarrão, óleo, açúcar, café, leite, pão, frutas e verduras frescas.',
      price: 89.90,
      stock: 50,
      weight: 15.5,
      categoryId: categoria1.id,
      images: [],
    },
    {
      name: 'Cesta Premium Gourmet',
      slug: 'cesta-premium-gourmet',
      description: 'Cesta com produtos selecionados de alta qualidade. Inclui produtos orgânicos, queijos especiais, vinhos e itens gourmet.',
      price: 249.90,
      stock: 20,
      weight: 12.0,
      categoryId: categoria2.id,
      images: [],
    },
    {
      name: 'Cesta Econômica Essencial',
      slug: 'cesta-economica-essencial',
      description: 'Cesta com os itens essenciais a um preço acessível. Ideal para quem busca economia sem abrir mão da qualidade.',
      price: 59.90,
      stock: 100,
      weight: 10.0,
      categoryId: categoria3.id,
      images: [],
    },
    {
      name: 'Cesta Básica Individual',
      slug: 'cesta-basica-individual',
      description: 'Cesta pensada para uma pessoa. Quantidades menores, mas com todos os itens necessários.',
      price: 49.90,
      stock: 75,
      weight: 7.5,
      categoryId: categoria1.id,
      images: [],
    },
    {
      name: 'Cesta Premium Executiva',
      slug: 'cesta-premium-executiva',
      description: 'Cesta premium com produtos importados e selecionados. Perfeita para presentear ou para ocasiões especiais.',
      price: 399.90,
      stock: 15,
      weight: 18.0,
      categoryId: categoria2.id,
      images: [],
    },
  ]

  for (const produto of produtos) {
    await prisma.product.upsert({
      where: { slug: produto.slug },
      update: {},
      create: produto,
    })
  }

  console.log('✅ Products created')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
