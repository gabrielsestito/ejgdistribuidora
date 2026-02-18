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
    const city = body.city !== undefined ? String(body.city).trim() : undefined
    const state = body.state !== undefined ? String(body.state).trim().toUpperCase() : undefined
    const active = body.active !== undefined ? Boolean(body.active) : undefined
    const minOrderAmount =
      body.minOrderAmount !== undefined ? parseFloat(String(body.minOrderAmount)) : undefined
    const updated = await prisma.freeShippingCity.update({
      where: { id: params.id },
      data: {
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(active !== undefined && { active }),
        ...(minOrderAmount !== undefined && { minOrderAmount }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating free shipping city:', error)
    return NextResponse.json({ error: 'Failed to update city' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await prisma.freeShippingCity.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting free shipping city:', error)
    return NextResponse.json({ error: 'Failed to delete city' }, { status: 500 })
  }
}
