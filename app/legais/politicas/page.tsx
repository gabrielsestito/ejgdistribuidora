import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function PoliciesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold">Políticas e Deveres</h1>
            <p className="text-gray-600 mt-2">Transparência sobre privacidade, entrega e relacionamento com o cliente</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Política de Privacidade</h2>
              <ul className="mt-2 text-gray-700 space-y-2 list-disc list-inside">
                <li>Dados usados somente para pedidos, entrega e suporte</li>
                <li>Armazenamento seguro e acesso restrito</li>
                <li>Sem compartilhamento com terceiros, exceto por obrigação legal</li>
              </ul>
            </section>
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold">Política de Entrega</h2>
              <ul className="mt-2 text-gray-700 space-y-2 list-disc list-inside">
                <li>Entrega em raio configurado a partir de Ribeirão Preto</li>
                <li>Frete calculado por distância; cidades podem ter frete grátis</li>
                <li>Informações de frete exibidas no checkout</li>
              </ul>
            </section>
            <section className="bg-white rounded-xl border shadow-sm p-6 md:col-span-2">
              <h2 className="text-lg font-semibold">Deveres do Consumidor</h2>
              <ul className="mt-2 text-gray-700 space-y-2 list-disc list-inside">
                <li>Preencher dados corretos e atualizados</li>
                <li>Garantir presença no endereço no horário combinado</li>
                <li>Conferir os itens no recebimento e reportar divergências</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
