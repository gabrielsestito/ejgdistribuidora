import nodemailer from 'nodemailer'

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS
const emailFrom = process.env.EMAIL_FROM || emailUser
const emailService = process.env.EMAIL_SERVICE || 'gmail'
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

const isEmailConfigured = Boolean(emailUser && emailPass && emailFrom)

function getTransporter() {
  if (smtpHost && smtpPort) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  }

  return nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })
}

const statusLabels: Record<string, string> = {
  RECEBIDO: 'Recebido',
  SEPARANDO: 'Separando',
  SAIU_PARA_ENTREGA: 'Saiu para Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

const paymentLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  FALHOU: 'Falhou',
  ESTORNADO: 'Estornado',
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!isEmailConfigured) {
    console.warn('Email not configured. Skipping send to', to)
    return
  }

  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
    })
  } catch {
    // Silenciar erros de envio para não interromper o checkout
  }
}

export async function sendOrderCreatedEmail(params: {
  to: string
  name: string
  code: string
  total: string
}) {
  const { to, name, code, total } = params
  const trackUrl = `${siteUrl}/acompanhar?code=${encodeURIComponent(code)}`
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Pedido recebido 🎉</h2>
      <p>Olá ${name}, recebemos seu pedido <strong>${code}</strong>.</p>
      <p>Total: <strong>${total}</strong></p>
      <p>Você pode acompanhar aqui: <a href="${trackUrl}">${trackUrl}</a></p>
      <p>Obrigado por comprar com a EJG Distribuidora.</p>
    </div>
  `
  await sendEmail(to, `Pedido recebido: ${code}`, html)
}

export async function sendOrderStatusEmail(params: {
  to: string
  name: string
  code: string
  status: string
  paymentStatus?: string
}) {
  const { to, name, code, status, paymentStatus } = params
  const statusLabel = statusLabels[status] || status
  const paymentLabel = paymentStatus ? paymentLabels[paymentStatus] || paymentStatus : null
  const trackUrl = `${siteUrl}/acompanhar?code=${encodeURIComponent(code)}`
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Atualização do pedido</h2>
      <p>Olá ${name}, o pedido <strong>${code}</strong> foi atualizado.</p>
      <p>Status: <strong>${statusLabel}</strong></p>
      ${paymentLabel ? `<p>Pagamento: <strong>${paymentLabel}</strong></p>` : ''}
      <p>Acompanhe aqui: <a href="${trackUrl}">${trackUrl}</a></p>
    </div>
  `
  await sendEmail(to, `Atualização do pedido: ${code}`, html)
}

export async function sendPaymentConfirmedEmail(params: {
  to: string
  name: string
  code: string
}) {
  const { to, name, code } = params
  const trackUrl = `${siteUrl}/acompanhar?code=${encodeURIComponent(code)}`
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Pagamento confirmado ✅</h2>
      <p>Olá ${name}, recebemos o pagamento do pedido <strong>${code}</strong>.</p>
      <p>Acompanhe aqui: <a href="${trackUrl}">${trackUrl}</a></p>
    </div>
  `
  await sendEmail(to, `Pagamento confirmado: ${code}`, html)
}
