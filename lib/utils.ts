import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string | bigint) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(price))
}

export function generateOrderCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `EJG${timestamp}${random}`
}

export function getWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`
}

export function parseImages(images: any): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseDetailedDescription(detailedDesc: any): Array<{quantity: number, name: string, brand?: string, unit?: string}> {
  if (!detailedDesc) return []
  if (Array.isArray(detailedDesc)) return detailedDesc
  try {
    const parsed = typeof detailedDesc === 'string' ? JSON.parse(detailedDesc) : detailedDesc
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
