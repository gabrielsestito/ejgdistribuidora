import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { generateQRCodeData } from '@/lib/qrcode'
import { sendOrderCreatedEmail } from '@/lib/email'
import { z } from 'zod'
import { createOrderCode } from '@/lib/order-code'

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL

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
  distance: z.number().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!accessToken) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 500 })
    }

    if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL inválido (use http/https)' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    const body = await req.json()
    const validated = orderSchema.parse(body)

    try {
      const cfg = await prisma.shippingConfig.findFirst()
      const minOrderAmount =
        cfg && (cfg as any).minOrderAmount !== undefined && (cfg as any).minOrderAmount !== null
          ? Number((cfg as any).minOrderAmount)
          : 0
      if (Number.isFinite(minOrderAmount) && minOrderAmount > 0 && validated.subtotal < minOrderAmount) {
        return NextResponse.json(
          { error: `Pedido mínimo é ${formatPrice(minOrderAmount)}` },
          { status: 400 }
        )
      }
    } catch (e) {
    }

    let user = session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : null

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: validated.customer.email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: validated.customer.email,
            name: validated.customer.name,
            phone: validated.customer.phone,
            password: '',
            role: 'CUSTOMER',
          },
        })
      }
    }

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

    const orderCode = await createOrderCode()
    const order = await prisma.order.create({
      data: {
        code: orderCode,
        qrCode: generateQRCodeData('', orderCode),
        userId: user.id,
        addressId: address.id,
        subtotal: validated.subtotal,
        shipping: validated.shipping,
        total: validated.total,
        paymentMethod: validated.paymentMethod || 'MERCADO_PAGO',
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

    const qrCode = generateQRCodeData(order.id, order.code)
    await prisma.order.update({
      where: { id: order.id },
      data: { qrCode },
    })

    

    const successUrl = new URL('/checkout', siteUrl)
    successUrl.searchParams.set('status', 'success')
    successUrl.searchParams.set('order', order.code)
    successUrl.searchParams.set('orderId', order.id)

    const pendingUrl = new URL('/checkout', siteUrl)
    pendingUrl.searchParams.set('status', 'pending')
    pendingUrl.searchParams.set('order', order.code)
    pendingUrl.searchParams.set('orderId', order.id)

    const failureUrl = new URL('/checkout', siteUrl)
    failureUrl.searchParams.set('status', 'failure')
    failureUrl.searchParams.set('order', order.code)
    failureUrl.searchParams.set('orderId', order.id)

    const webhookUrl = new URL('/api/webhooks/mercadopago', siteUrl).toString()

    const backUrls = {
      success: successUrl.toString(),
      pending: pendingUrl.toString(),
      failure: failureUrl.toString(),
    }

    const preferencePayload = {
      items: order.items.map((item) => ({
        title: item.product?.name || 'Produto',
        quantity: item.quantity,
        unit_price: Number(item.price),
      })),
      payer: {
        name: validated.customer.name,
        email: validated.customer.email,
      },
      external_reference: order.id,
      back_urls: backUrls,
      // auto_return removido para evitar erro quando back_urls não é aceito pelo MP
      notification_url: webhookUrl,
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencePayload),
    })
    
    const raw = await mpResponse.text()
    let data: any = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = null
    }
    if (!mpResponse.ok) {
      const message = (data && data.message) || raw || 'Erro ao criar pagamento'
      return NextResponse.json({ error: message }, { status: 500 })
    }
    
    const initPoint = (data && (data.init_point || data.sandbox_init_point)) || null
    if (!initPoint) {
      return NextResponse.json(
        { error: 'Mercado Pago não retornou URL de pagamento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      initPoint,
      id: data.id,
      orderId: order.id,
      orderCode: order.code,
    })
  } catch (error) {
    const safeMsg =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error)
    console.error('Mercado Pago checkout error:', safeMsg)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro ao iniciar pagamento' }, { status: 500 })
  }
}
