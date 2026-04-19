import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn } from 'child_process'

function parseDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL não configurado')
  }

  const url = new URL(dbUrl)
  if (url.protocol !== 'mysql:') {
    throw new Error('Somente MySQL é suportado para backup automático')
  }

  return {
    host: url.hostname,
    port: url.port || '3306',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.replace('/', ''),
  }
}

function buildDumpArgs(config: ReturnType<typeof parseDatabaseUrl>) {
  const args = [
    '--default-character-set=utf8mb4',
    '--single-transaction',
    '--quick',
    '--routines',
    '--events',
    '--triggers',
    '-h',
    config.host,
    '-P',
    config.port,
    '-u',
    config.user,
  ]

  if (config.password) {
    args.push(`-p${config.password}`)
  }

  args.push(config.database)
  return args
}

function createFilename() {
  const now = new Date()
  const stamp = now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('Z')[0]
  return `backup-${stamp}.sql`
}

export async function POST(_: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = parseDatabaseUrl()
    let dumpBuffer: Buffer | null = null

    // Tentativa 1: usar binário mysqldump (mais rápido/robusto se instalado)
    try {
      const args = buildDumpArgs(config)
      dumpBuffer = await new Promise<Buffer>((resolve, reject) => {
        const child = spawn('mysqldump', args)
        const stdout: Buffer[] = []
        const stderr: Buffer[] = []

        child.stdout.on('data', (data) => stdout.push(data))
        child.stderr.on('data', (data) => stderr.push(data))

        child.on('error', (error) => {
          reject(error)
        })

        child.on('close', (code) => {
          if (code !== 0) {
            const errorMessage = Buffer.concat(stderr).toString() || 'Erro ao gerar backup'
            reject(new Error(errorMessage))
            return
          }
          resolve(Buffer.concat(stdout))
        })
      })
    } catch (e: any) {
      // Tentativa 2: fallback para biblioteca JS 'mysqldump' (não requer binário)
      const mysqldumpMod: any = await import('mysqldump')
      const result = await mysqldumpMod.default({
        connection: {
          host: config.host,
          port: Number(config.port),
          user: config.user,
          password: config.password,
          database: config.database,
        },
      })
      const sql = [
        result?.dump?.schema || '',
        result?.dump?.trigger || '',
        result?.dump?.data || '',
      ]
        .filter(Boolean)
        .join('\n\n')
      dumpBuffer = Buffer.from(sql, 'utf8')
    }

    const filename = createFilename()

    const arrayBuffer = dumpBuffer.buffer.slice(
      dumpBuffer.byteOffset,
      dumpBuffer.byteOffset + dumpBuffer.byteLength
    )
    return new NextResponse(arrayBuffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    const message =
      error?.code === 'ENOENT'
        ? 'mysqldump não encontrado. Instale o MySQL Client e tente novamente.'
        : error?.message || 'Erro ao gerar backup'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
