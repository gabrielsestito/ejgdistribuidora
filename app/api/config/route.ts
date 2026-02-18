import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const config = await prisma.shippingConfig.findFirst()
    let minOrderAmount = 50
    const raw = (config as any)?.minOrderAmount
    if (raw !== undefined && raw !== null) {
      const parsed = Number(raw)
      if (Number.isFinite(parsed) && parsed > 0) {
        minOrderAmount = parsed
      }
    }
    return NextResponse.json({ minOrderAmount })
  } catch (error) {
    console.error('Error fetching public config:', error)
    return NextResponse.json({ minOrderAmount: 50 })
  }
}
