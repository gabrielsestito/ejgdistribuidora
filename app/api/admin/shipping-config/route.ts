import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const config = await prisma.shippingConfig.findFirst()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching shipping config:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping config' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const maxDistanceKm = body.maxDistanceKm !== undefined ? parseFloat(String(body.maxDistanceKm)) : undefined
    const minOrderAmount = body.minOrderAmount !== undefined ? parseFloat(String(body.minOrderAmount)) : undefined
    if (maxDistanceKm !== undefined && (isNaN(maxDistanceKm) || maxDistanceKm <= 0)) {
      return NextResponse.json({ error: 'maxDistanceKm inválido' }, { status: 400 })
    }
    if (minOrderAmount !== undefined && (isNaN(minOrderAmount) || minOrderAmount < 0)) {
      return NextResponse.json({ error: 'minOrderAmount inválido' }, { status: 400 })
    }
    let config = await prisma.shippingConfig.findFirst()
    if (!config) {
      config = await prisma.shippingConfig.create({
        data: {
          maxDistanceKm: maxDistanceKm ?? 100,
          minOrderAmount: minOrderAmount ?? 50,
        },
      })
    } else {
      config = await prisma.shippingConfig.update({
        where: { id: config.id },
        data: {
          ...(maxDistanceKm !== undefined && { maxDistanceKm }),
          ...(minOrderAmount !== undefined && { minOrderAmount }),
        },
      })
    }
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating shipping config:', error)
    return NextResponse.json({ error: 'Failed to update shipping config' }, { status: 500 })
  }
}
