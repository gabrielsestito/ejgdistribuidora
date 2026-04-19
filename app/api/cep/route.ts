import { NextRequest, NextResponse } from 'next/server'

async function fetchJsonWithTimeout(url: string, options: RequestInit, timeoutMs = 6000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) {
      return NextResponse.json({ error: 'CEP service unavailable' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'CEP service unavailable' }, { status: 503 })
  } finally {
    clearTimeout(id)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const zip = (searchParams.get('zip') || '').replace(/\D/g, '')
  if (!zip || zip.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }
  // 1) ViaCEP
  let first: NextResponse | null = null
  try {
    first = (await fetchJsonWithTimeout(`https://viacep.com.br/ws/${zip}/json/`, {}, 6000)) as any
    // Se tiver "erro": true no payload, tentar próximo provedor
    try {
      const json = await (first as any).json()
      if (json?.erro) first = null
      else return NextResponse.json(json)
    } catch {
      // response já é JSON pronto quando veio de fetchJsonWithTimeout; apenas retorna
      return first as any
    }
  } catch {}

  // 2) BrasilAPI fallback
  try {
    const br = await fetch(`https://brasilapi.com.br/api/cep/v1/${zip}`, { next: { revalidate: 60 } })
    if (br.ok) {
      const data = await br.json()
      // normaliza para estrutura parecida com ViaCEP para o front
      return NextResponse.json({
        cep: zip,
        logradouro: data.street || '',
        bairro: data.neighborhood || '',
        localidade: data.city || '',
        uf: data.state || '',
      })
    }
  } catch {}

  return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
}
