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

    const rates = await prisma.shippingRate.findMany({
      orderBy: { minDistance: 'asc' },
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching shipping rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { minDistance, maxDistance, price, active } = body

    const rate = await prisma.shippingRate.create({
      data: {
        minDistance: parseFloat(minDistance),
        maxDistance: parseFloat(maxDistance),
        price: parseFloat(price),
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error creating shipping rate:', error)
    return NextResponse.json(
      { error: 'Failed to create shipping rate' },
      { status: 500 }
    )
  }
}
