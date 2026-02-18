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
    const cities = await prisma.freeShippingCity.findMany({
      orderBy: [{ state: 'asc' }, { city: 'asc' }],
    })
    return NextResponse.json(cities)
  } catch (error) {
    console.error('Error fetching free shipping cities:', error)
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const city = String(body.city || '').trim()
    const state = String(body.state || '').trim().toUpperCase()
    const active = body.active !== undefined ? Boolean(body.active) : true
    const minOrderAmount =
      body.minOrderAmount !== undefined ? parseFloat(String(body.minOrderAmount)) : 0
    if (!city || !state || state.length !== 2) {
      return NextResponse.json({ error: 'Cidade/UF inválidos' }, { status: 400 })
    }
    const existing = await prisma.freeShippingCity.findFirst({
      where: { city, state },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Cidade já cadastrada para esta UF' },
        { status: 409 }
      )
    }
    const safeMinOrder = isNaN(minOrderAmount) || minOrderAmount < 0 ? 0 : minOrderAmount
    const created = await prisma.freeShippingCity.create({
      data: { city, state, active, minOrderAmount: safeMinOrder },
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating free shipping city:', error)
    if (String(error).includes('Unique constraint') || String(error).includes('Unique')) {
      return NextResponse.json(
        { error: 'Cidade já cadastrada para esta UF' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Erro ao criar cidade' }, { status: 500 })
  }
}
