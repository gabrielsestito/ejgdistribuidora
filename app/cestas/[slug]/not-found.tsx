import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function ProductNotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 mb-8">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Button asChild>
            <Link href="/cestas">Ver Todas as Cestas</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  )
}
