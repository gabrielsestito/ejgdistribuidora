import { generateOrderCode } from './utils'

export function generateQRCodeData(orderId: string, orderCode: string): string {
  // Gerar dados do QR Code no formato: ORDER_ID|ORDER_CODE
  return `${orderId}|${orderCode}`
}

export function parseQRCodeData(qrData: string): { orderId: string; orderCode: string } | null {
  try {
    const [orderId, orderCode] = qrData.split('|')
    if (orderId && orderCode) {
      return { orderId, orderCode }
    }
    return null
  } catch {
    return null
  }
}
