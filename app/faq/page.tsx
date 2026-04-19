import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold">Perguntas Frequentes</h1>
            <p className="text-gray-600 mt-2">Tire suas dúvidas sobre entrega, pagamento e pedidos</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Como funciona a entrega?</h2>
              <p className="text-gray-700 mt-2">
                Entregamos em um raio configurado a partir de Ribeirão Preto. O valor do frete é calculado
                pelo CEP durante o checkout. Algumas cidades podem ter frete grátis conforme cadastro.
              </p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Quais são as formas de pagamento?</h2>
              <p className="text-gray-700 mt-2">
                Você pode pagar via Mercado Pago (Pix, cartão, etc.). O pedido é criado e você é
                redirecionado para concluir o pagamento com segurança.
              </p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Posso acompanhar meu pedido?</h2>
              <p className="text-gray-700 mt-2">
                Sim. Após a confirmação, você recebe um código de pedido. Use a página “Acompanhar Pedido”
                para ver o status em tempo real.
              </p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Existe pedido mínimo?</h2>
              <p className="text-gray-700 mt-2">
                Sim, trabalhamos com pedido mínimo exibido no checkout. Para frete grátis por cidade,
                pode haver um valor mínimo específico.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
