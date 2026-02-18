import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const kitItems = await prisma.kitItem.findMany({
      where: { kitId: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ ...product, kitItems })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

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
    
    // Processar imagens se for string JSON
    const updateData: any = { ...body }
    if (updateData.images && typeof updateData.images === 'string') {
      try {
        updateData.images = JSON.parse(updateData.images)
      } catch {
        // Se não for JSON válido, manter como está
      }
    }
    if (typeof updateData.expirationDate === 'string') {
      updateData.expirationDate = updateData.expirationDate
        ? new Date(updateData.expirationDate)
        : null
    }
    if (updateData.categoryId) {
      updateData.category = { connect: { id: updateData.categoryId } }
      delete updateData.categoryId
    }
    if (updateData.wholesalePackSize === '') updateData.wholesalePackSize = null
    if (updateData.wholesalePackPrice === '') updateData.wholesalePackPrice = null
    if (updateData.sellingMode && !['UNIT', 'PACK', 'BOTH'].includes(updateData.sellingMode)) {
      updateData.sellingMode = 'UNIT'
    }
    if (typeof updateData.sku === 'string') {
      updateData.sku = updateData.sku.trim()
      if (updateData.sku === '') {
        updateData.sku = null
      } else {
        updateData.sku = updateData.sku.toUpperCase().replace(/[^A-Z0-9-]/g, '').replace(/--+/g, '-')
        const exists = await prisma.product.findFirst({
          where: { sku: updateData.sku, NOT: { id: params.id } },
        })
        if (exists) {
          return NextResponse.json({ error: 'SKU já existe' }, { status: 400 })
        }
      }
    }

    // Remover kitItems do updateData (será tratado separadamente)
    const kitItems = updateData.kitItems
    delete updateData.kitItems
    
    // Atualizar produto
    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    })

    // Se for KIT e tiver itens, atualizar itens do kit
    if (updateData.productType === 'KIT' && kitItems) {
      // Deletar itens antigos
      await prisma.kitItem.deleteMany({
        where: { kitId: params.id },
      })

      // Criar novos itens
      if (kitItems.length > 0) {
        await prisma.kitItem.createMany({
          data: kitItems.map((item: any) => ({
            kitId: params.id,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            brand: item.brand,
            notes: item.notes,
          })),
        })
      }
    } else if (updateData.productType !== 'KIT') {
      // Se mudou de KIT para NORMAL, deletar itens do kit
      await prisma.kitItem.deleteMany({
        where: { kitId: params.id },
      })
    }

    // Buscar produto atualizado com itens do kit
    const updatedProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        kitItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
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

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    )
  }
}
