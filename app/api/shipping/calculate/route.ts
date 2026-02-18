import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Coordenadas de Ribeirão Preto (centro)
const RIBEIRAO_PRETO_LAT = -21.1775
const RIBEIRAO_PRETO_LNG = -47.8103
async function getMaxDistanceKm(): Promise<number> {
  try {
    const config = await prisma.shippingConfig.findFirst()
    if (config?.maxDistanceKm) {
      return Number(config.maxDistanceKm as any)
    }
  } catch {}
  return 100
}

// Função para calcular distância entre duas coordenadas (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

type CoordinatesResult =
  | { coordinates: { lat: number; lng: number } }
  | { coordinates: null; reason: 'NOT_FOUND' | 'UNAVAILABLE' }

async function fetchJsonWithTimeout(url: string, options: RequestInit, timeoutMs = 6000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

// Função para buscar coordenadas do CEP usando API ViaCEP e depois geocoding
async function getCoordinatesFromZipCode(zipCode: string): Promise<CoordinatesResult> {
  const cleanZipCode = zipCode.replace(/\D/g, '')
  let viaCepData: any

  try {
    viaCepData = await fetchJsonWithTimeout(
      `https://viacep.com.br/ws/${cleanZipCode}/json/`,
      {},
      5000
    )
  } catch {
    return { coordinates: null, reason: 'UNAVAILABLE' }
  }

  if (viaCepData?.erro) {
    return { coordinates: null, reason: 'NOT_FOUND' }
  }

  const address = `${viaCepData.logradouro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`
  const geocodeHeaders = { 'User-Agent': 'EJG Distribuidora' }

  try {
    const geocodeData = await fetchJsonWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: geocodeHeaders },
      6000
    )

    if (geocodeData && geocodeData.length > 0) {
      return {
        coordinates: {
          lat: parseFloat(geocodeData[0].lat),
          lng: parseFloat(geocodeData[0].lon),
        },
      }
    }
  } catch {
    return { coordinates: null, reason: 'UNAVAILABLE' }
  }

  try {
    const geocodeByCep = await fetchJsonWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanZipCode}&country=Brazil&limit=1`,
      { headers: geocodeHeaders },
      6000
    )

    if (geocodeByCep && geocodeByCep.length > 0) {
      return {
        coordinates: {
          lat: parseFloat(geocodeByCep[0].lat),
          lng: parseFloat(geocodeByCep[0].lon),
        },
      }
    }
  } catch {
    return { coordinates: null, reason: 'UNAVAILABLE' }
  }

  return { coordinates: null, reason: 'NOT_FOUND' }
}

export async function POST(req: NextRequest) {
  try {
    const { zipCode, subtotal } = await req.json()

    if (!zipCode) {
      return NextResponse.json({ error: 'CEP é obrigatório' }, { status: 400 })
    }

    let viaCepData: any = null
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode.replace(/\D/g, '')}/json/`)
      viaCepData = await response.json()
      if (viaCepData?.erro) {
        viaCepData = null
      }
    } catch {}

    if (viaCepData) {
      const city = String(viaCepData.localidade || '').trim()
      const state = String(viaCepData.uf || '').trim().toUpperCase()
      if (city && state) {
        const freeCity = await prisma.freeShippingCity.findFirst({
          where: { city, state, active: true },
        })
        if (freeCity) {
          const minAmount = Number(freeCity.minOrderAmount as any || 0)
          const hasNoMinimum = !minAmount || minAmount <= 0
          const meetsMinimum = subtotal !== undefined && Number(subtotal) >= minAmount
          if (hasNoMinimum || meetsMinimum) {
          return NextResponse.json({
            available: true,
            distance: null,
            shippingPrice: 0,
            shippingRateId: null,
            freeCity: { city, state },
            freeShipping: true,
            message: `Frete grátis para ${city}/${state}`,
          })
          }
        }
      }
    }

    // Buscar coordenadas do CEP
    const coordinatesResult = await getCoordinatesFromZipCode(zipCode)

    if (!coordinatesResult.coordinates) {
      const isUnavailable = coordinatesResult.reason === 'UNAVAILABLE'
      return NextResponse.json(
        {
          error: isUnavailable
            ? 'Serviço de localização indisponível. Tente novamente.'
            : 'CEP não encontrado ou inválido',
        },
        { status: isUnavailable ? 503 : 400 }
      )
    }

    // Calcular distância
    const distance = calculateDistance(
      RIBEIRAO_PRETO_LAT,
      RIBEIRAO_PRETO_LNG,
      coordinatesResult.coordinates.lat,
      coordinatesResult.coordinates.lng
    )

    const MAX_DISTANCE_KM = await getMaxDistanceKm()
    if (distance > MAX_DISTANCE_KM) {
      return NextResponse.json(
        {
          error: 'Fora da área de entrega',
          message: `Entregamos apenas em um raio de ${MAX_DISTANCE_KM}km de Ribeirão Preto. Sua localização está a ${distance.toFixed(1)}km.`,
          distance: distance.toFixed(2),
          available: false,
        },
        { status: 400 }
      )
    }

    // Buscar faixa de frete
    const shippingRate = await prisma.shippingRate.findFirst({
      where: {
        active: true,
        minDistance: { lte: distance },
        maxDistance: { gte: distance },
      },
      orderBy: { minDistance: 'asc' },
    })

    if (!shippingRate) {
      return NextResponse.json(
        {
          error: 'Frete não configurado para esta distância',
          distance: distance.toFixed(2),
          available: true,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      available: true,
      distance: parseFloat(distance.toFixed(2)),
      shippingPrice: Number(shippingRate.price),
      shippingRateId: shippingRate.id,
    })
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular frete' },
      { status: 500 }
    )
  }
}
