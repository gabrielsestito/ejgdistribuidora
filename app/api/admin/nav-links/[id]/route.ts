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
    const updated = await prisma.navLink.update({
      where: { id: params.id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.link !== undefined && { link: body.link }),
        ...(body.iconUrl !== undefined && { iconUrl: body.iconUrl }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.active !== undefined && { active: body.active }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating nav link:', error)
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
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
    await prisma.navLink.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting nav link:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
