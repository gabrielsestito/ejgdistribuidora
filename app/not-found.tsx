import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Página não encontrada</p>
          <Button asChild>
            <Link href="/">Voltar para Home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  )
}
