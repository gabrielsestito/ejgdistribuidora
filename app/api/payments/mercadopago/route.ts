import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL

export async function POST(req: NextRequest) {
  try {
    if (!accessToken) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 500 })
    }

    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL inválido (use http/https)' },
        { status: 500 }
      )
    }

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

    const preferencePayload = {
      items: order.items.map((item) => ({
        title: item.product?.name || 'Produto',
        quantity: item.quantity,
        unit_price: Number(item.price),
      })),
      payer: {
        name: order.user.name,
        email: order.user.email,
      },
      external_reference: order.id,
      back_urls: {
        success: successUrl.toString(),
        pending: pendingUrl.toString(),
        failure: failureUrl.toString(),
      },
      auto_return: 'approved',
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
    })
  } catch (error) {
    const safeMsg =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error)
    console.error('Mercado Pago checkout error:', safeMsg)
    return NextResponse.json({ error: 'Erro ao iniciar pagamento' }, { status: 500 })
  }
}
