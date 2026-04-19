'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function DeleteNavLinkButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Remover este item do submenu?')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/nav-links/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch (e) {
      alert('Erro ao remover')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleDelete} disabled={loading}>
      {loading ? 'Removendo...' : 'Remover'}
    </Button>
  )
}

