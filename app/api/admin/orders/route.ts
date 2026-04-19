import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQRCodeData } from '@/lib/qrcode'
import { createOrderCode } from '@/lib/order-code'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      customer,
      address,
      items,
      subtotal,
      shipping,
      total,
      userId,
      paymentMethod,
      notes,
    } = body

    // Encontrar ou criar usuário
    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } else {
      // Verificar se já existe por email
      user = await prisma.user.findUnique({
        where: { email: customer.email },
      })

      if (!user) {
        // Criar novo usuário
        user = await prisma.user.create({
          data: {
            email: customer.email,
            name: customer.name,
            phone: customer.phone || null,
            password: '', // Senha vazia, usuário precisará definir depois
            role: 'CUSTOMER',
          },
        })
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Erro ao processar usuário' }, { status: 400 })
    }

    // Criar ou encontrar endereço
    let addressRecord = await prisma.address.findFirst({
      where: {
        userId: user.id,
        street: address.street,
        number: address.number,
        zipCode: address.zipCode,
      },
    })

    if (!addressRecord) {
      addressRecord = await prisma.address.create({
        data: {
          userId: user.id,
          ...address,
        },
      })
    }

    // Criar pedido
    const orderCode = await createOrderCode()
    const order = await prisma.order.create({
      data: {
        code: orderCode,
        qrCode: generateQRCodeData('', orderCode),
        userId: user.id,
        addressId: addressRecord.id,
        subtotal: parseFloat(subtotal),
        shipping: parseFloat(shipping || 0),
        total: parseFloat(total),
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        status: 'RECEBIDO',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        statusLogs: {
          create: {
            status: 'RECEBIDO',
            notes: 'Pedido criado manualmente pelo admin',
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

    // Atualizar QR Code
    const qrCode = generateQRCodeData(order.id, order.code)
    await prisma.order.update({
      where: { id: order.id },
      data: { qrCode },
    })

    // Atualizar estoque dos produtos
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })

      // Registrar movimentação de estoque
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'SAIDA',
          quantity: item.quantity,
          reason: `Pedido manual ${orderCode}`,
          orderId: order.id,
          createdBy: session.user.id,
        },
      })
    }

    return NextResponse.json({ ...order, qrCode })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
