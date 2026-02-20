import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentConfirmedEmail } from '@/lib/email'

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

function mapPaymentStatus(status: string) {
  if (status === 'approved') return 'PAGO'
  if (status === 'rejected' || status === 'cancelled') return 'FALHOU'
  if (status === 'refunded' || status === 'charged_back') return 'ESTORNADO'
  return 'PENDENTE'
}

function mapPaymentMethodDetail(typeId?: string, methodId?: string) {
  if (!typeId && !methodId) return null
  const typeLabels: Record<string, string> = {
    pix: 'Pix',
    credit_card: 'Cartão de crédito',
    debit_card: 'Cartão de débito',
    ticket: 'Boleto',
    bank_transfer: 'Transferência bancária',
    atm: 'Pagamento em lotérica/ATM',
    prepaid_card: 'Cartão pré-pago',
    digital_currency: 'Carteira digital',
  }
  const typeLabel = typeId ? typeLabels[typeId] || typeId : null
  const detail = typeLabel || methodId || 'Mercado Pago'
  return `Mercado Pago - ${detail}`
}

export async function POST(req: NextRequest) {
  try {
    if (!accessToken) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 500 })
    }

    const body = await req.json()
    const paymentId = body?.data?.id || body?.id

    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const payment = await paymentResponse.json()
    if (!paymentResponse.ok) {
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 })
    }

    const orderId = payment.external_reference
    if (!orderId) {
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })
    if (!order) {
      return NextResponse.json({ received: true })
    }

    const paymentStatus = mapPaymentStatus(payment.status)
    const paymentMethodDetail = mapPaymentMethodDetail(
      payment.payment_type_id,
      payment.payment_method_id
    )
    const shouldUpdate =
      order.paymentStatus !== paymentStatus || order.mercadoPagoId !== String(paymentId)

    if (shouldUpdate) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus,
          paymentMethod: 'MERCADO_PAGO',
          paymentMethodDetail: paymentMethodDetail || undefined,
          mercadoPagoId: String(paymentId),
          statusLogs:
            paymentStatus === 'PAGO'
              ? {
                  create: {
                    status: order.status,
                    notes: 'Pagamento aprovado via Mercado Pago',
                  },
                }
              : undefined,
        },
      })

      if (order.user?.email) {
        if (paymentStatus === 'PAGO') {
          await sendPaymentConfirmedEmail({
            to: order.user.email,
            name: order.user.name,
            code: order.code,
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const safeMsg =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error)
    console.error('Mercado Pago webhook error:', safeMsg)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
