'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Database, Loader2 } from 'lucide-react'

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null
  const match = disposition.match(/filename="([^"]+)"/)
  return match?.[1] || null
}

export function BackupButton() {
  const [loading, setLoading] = useState(false)

  const handleBackup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/backup', { method: 'POST' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao gerar backup')
      }

      const blob = await response.blob()
      const filename =
        getFilenameFromDisposition(response.headers.get('content-disposition')) ||
        'backup.sql'

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar backup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleBackup} disabled={loading} variant="outline">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando backup...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Backup do banco
        </>
      )}
    </Button>
  )
}
