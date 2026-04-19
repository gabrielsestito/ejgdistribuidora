import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  iconUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

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
    const data = patchSchema.parse(body)

    let slugUpdate: string | undefined = undefined
    if (data.slug || data.name) {
      const baseSlug = (data.slug || data.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      let slug = baseSlug
      let counter = 1
      while (slug && await (prisma as any).subcategory.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      slugUpdate = slug || undefined
    }

    const updated = await (prisma as any).subcategory.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(slugUpdate !== undefined && { slug: slugUpdate }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.active !== undefined && { active: data.active }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating subcategory:', error)
    return NextResponse.json({ error: 'Erro ao atualizar subcategoria' }, { status: 500 })
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

    await (prisma as any).subcategory.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subcategory:', error)
    return NextResponse.json({ error: 'Erro ao excluir subcategoria' }, { status: 500 })
  }
}
