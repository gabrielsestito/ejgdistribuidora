import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { minDistance, maxDistance, price, active } = body

    const rate = await prisma.shippingRate.update({
      where: { id: params.id },
      data: {
        ...(minDistance !== undefined && { minDistance: parseFloat(minDistance) }),
        ...(maxDistance !== undefined && { maxDistance: parseFloat(maxDistance) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error updating shipping rate:', error)
    return NextResponse.json(
      { error: 'Failed to update shipping rate' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.shippingRate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping rate:', error)
    return NextResponse.json(
      { error: 'Failed to delete shipping rate' },
      { status: 500 }
    )
  }
}
