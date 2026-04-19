import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold">Termos de Uso</h1>
            <p className="text-gray-600 mt-2">Condições para uso do site, pedidos e pagamentos</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Aceitação dos Termos</h2>
              <ul className="mt-2 text-gray-700 space-y-2 list-disc list-inside">
                <li>Ao utilizar o site, você aceita estes termos</li>
                <li>Conteúdo com uso pessoal e não comercial</li>
                <li>Respeito às leis e políticas vigentes</li>
              </ul>
            </section>
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Pedidos e Pagamentos</h2>
              <ul className="mt-2 text-gray-700 space-y-2 list-disc list-inside">
                <li>Processamento após confirmação de pagamento</li>
                <li>Reprocessamento possível pelo link do checkout em caso de falha</li>
                <li>Validação de dados em caso de divergências</li>
              </ul>
            </section>
            <section className="bg-white rounded-xl border shadow-sm p-6 md:col-span-2">
              <h2 className="text-lg font-semibold">Limitações de Responsabilidade</h2>
              <ul className="mt-2 text-gray-700 space-y-2 list-disc list-inside">
                <li>Atrasos externos (clima, trânsito) podem ocorrer</li>
                <li>Informações de status são atualizadas no “Acompanhar Pedido”</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
