import { prisma } from '@/lib/prisma'

export async function createOrderCode() {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  })

  let nextNumber = 1
  const match = lastOrder?.code?.match(/EJG(\d+)/i)
  if (match?.[1]) {
    const parsed = Number.parseInt(match[1], 10)
    if (!Number.isNaN(parsed)) {
      nextNumber = parsed + 1
    }
  }

  while (true) {
    const code = `EJG${String(nextNumber).padStart(4, '0')}`
    const existing = await prisma.order.findUnique({
      where: { code },
      select: { id: true },
    })
    if (!existing) {
      return code
    }
    nextNumber += 1
  }
}
