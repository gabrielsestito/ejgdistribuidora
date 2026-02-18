'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/cart-context'
import { CheckoutForm } from '@/components/checkout/checkout-form'

export default function CheckoutPage() {
  const { items } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setStatus(params.get('status'))
    }
  }, [])

  useEffect(() => {
    if (items.length === 0 && !status) {
      router.push('/carrinho')
    }
  }, [items.length, status, router])

  if (items.length === 0 && !status) {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <CheckoutForm user={session?.user} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
