import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { employeeId, type, title, description, fileUrl, fileName, fileSize } = body

    if (!employeeId || !type || !title || !fileUrl || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        type,
        title,
        description: description || null,
        fileUrl,
        fileName,
        fileSize: fileSize || null,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')

    const documents = await prisma.employeeDocument.findMany({
      where: employeeId ? { employeeId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
