import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { generateQRCodeData } from '@/lib/qrcode'
import { sendOrderCreatedEmail } from '@/lib/email'
import { createOrderCode } from '@/lib/order-code'
import { z } from 'zod'

const orderSchema = z.object({
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  address: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    reference: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number(),
    })
  ),
  paymentMethod: z.string().optional(),
  subtotal: z.number(),
  shipping: z.number(),
  total: z.number(),
  zipCode: z.string().optional(),
  distance: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    const validated = orderSchema.parse(body)

    // Find or create user
    let user = session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : null

    if (!user) {
      // Check if user exists by email
      user = await prisma.user.findUnique({
        where: { email: validated.customer.email },
      })

      if (!user) {
        // Create new user (customer)
        user = await prisma.user.create({
          data: {
            email: validated.customer.email,
            name: validated.customer.name,
            phone: validated.customer.phone,
            password: '', // Will need to set password later
            role: 'CUSTOMER',
          },
        })
      }
    }

    // Create or find address
    let address = await prisma.address.findFirst({
      where: {
        userId: user.id,
        street: validated.address.street,
        number: validated.address.number,
        zipCode: validated.address.zipCode,
      },
    })

    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: user.id,
          ...validated.address,
        },
      })
    }

    // Create order
    const orderCode = await createOrderCode()
    const order = await prisma.order.create({
      data: {
        code: orderCode,
        qrCode: generateQRCodeData('', orderCode), // Será atualizado após criar
        userId: user.id,
        addressId: address.id,
        subtotal: validated.subtotal,
        shipping: validated.shipping,
        total: validated.total,
        paymentMethod: validated.paymentMethod || null,
        paymentStatus: 'PENDENTE',
        zipCode: validated.zipCode,
        distance: validated.distance ? parseFloat(validated.distance.toString()) : null,
        status: 'RECEBIDO',
        items: {
          create: validated.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        statusLogs: {
          create: {
            status: 'RECEBIDO',
            notes: 'Pedido criado',
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Atualizar QR Code com o ID do pedido
    const qrCode = generateQRCodeData(order.id, order.code)
    await prisma.order.update({
      where: { id: order.id },
      data: { qrCode },
    })

    if (user.email) {
      try {
        await sendOrderCreatedEmail({
          to: user.email,
          name: user.name,
          code: order.code,
          total: formatPrice(Number(order.total)),
        })
      } catch (emailError) {
        console.error('Error sending order email:', emailError)
      }
    }

    return NextResponse.json({ ...order, qrCode })
  } catch (error) {
    console.error('Error creating order:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
