import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { street, number, complement, neighborhood, city, state, zipCode, reference } = body

    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: rua, número, bairro, cidade, estado e CEP' },
        { status: 400 }
      )
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        street,
        number,
        complement: complement || null,
        neighborhood,
        city,
        state: state.toUpperCase(),
        zipCode,
        reference: reference || null,
      },
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error('Error saving address:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar endereço' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar endereços' },
      { status: 500 }
    )
  }
}
