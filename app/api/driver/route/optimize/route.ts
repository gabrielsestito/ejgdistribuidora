import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type Stop = {
  orderId: string
  code: string
  customerName: string
  phone?: string
  address: {
    street: string
    number: string
    complement?: string | null
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
}

function formatAddress(stop: Stop) {
  const complement = stop.address.complement ? `, ${stop.address.complement}` : ''
  return `${stop.address.street}, ${stop.address.number}${complement} - ${stop.address.neighborhood}, ${stop.address.city}/${stop.address.state}, Brasil`
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'EJG Distribuidora',
        },
      }
    )
    const data = await response.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error('Error geocoding address:', error)
    return null
  }
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const stops: Stop[] = Array.isArray(body?.stops) ? body.stops : []
    const driverLocation: { lat: number; lng: number } | null = body?.driverLocation || null

    if (stops.length < 2) {
      return NextResponse.json({ stops })
    }

    // Geocodificar todos os endereços de entrega
    const enriched: Array<Stop & { coords: { lat: number; lng: number } | null }> = []
    for (const stop of stops) {
      const coords = await geocodeAddress(formatAddress(stop))
      enriched.push({ ...stop, coords })
    }

    const withCoords = enriched.filter((s) => s.coords)
    const withoutCoords = enriched.filter((s) => !s.coords)

    if (withCoords.length < 2) {
      return NextResponse.json({ stops })
    }

    // Se temos a localização do entregador, começar do ponto mais próximo dele
    // Caso contrário, começar do primeiro endereço
    const ordered: typeof withCoords = []
    const remaining = [...withCoords]
    
    let current: typeof withCoords[0]
    
    if (driverLocation) {
      // Encontrar o endereço mais próximo da localização do entregador
      let bestIndex = 0
      let bestDistance = Infinity
      for (let i = 0; i < remaining.length; i += 1) {
        const candidate = remaining[i]
        const dist = distanceKm(driverLocation, candidate.coords!)
        if (dist < bestDistance) {
          bestDistance = dist
          bestIndex = i
        }
      }
      current = remaining.splice(bestIndex, 1)[0]
    } else {
      // Sem localização do entregador, começar do primeiro
      current = remaining.shift()!
    }
    
    ordered.push(current)

    // Algoritmo guloso: sempre escolher o próximo ponto mais próximo
    while (remaining.length > 0) {
      let bestIndex = 0
      let bestDistance = Infinity
      for (let i = 0; i < remaining.length; i += 1) {
        const candidate = remaining[i]
        const dist = distanceKm(current.coords!, candidate.coords!)
        if (dist < bestDistance) {
          bestDistance = dist
          bestIndex = i
        }
      }
      current = remaining.splice(bestIndex, 1)[0]
      ordered.push(current)
    }

    const orderedStops = [
      ...ordered.map(({ coords: _coords, ...stop }) => stop),
      ...withoutCoords.map(({ coords: _coords, ...stop }) => stop),
    ]

    return NextResponse.json({ stops: orderedStops })
  } catch (error) {
    console.error('Error optimizing route:', error)
    return NextResponse.json({ error: 'Erro ao organizar rota' }, { status: 500 })
  }
}
