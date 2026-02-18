import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Building2, CheckCircle2, Package, ShieldCheck, Clock, Phone } from 'lucide-react'

export default function SobrePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Sobre a EJG Cesta Básica
            </h1>
            <p className="text-gray-600">
              Qualidade, preço justo e entrega ágil — todos os dias.
            </p>
          </header>

          <section className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                A EJG Cesta Básica nasceu com o propósito de oferecer produtos essenciais com qualidade, preço justo e entrega ágil. Trabalhamos com cestas básicas completas, kits de limpeza e produtos alimentícios selecionados, sempre priorizando marcas confiáveis e excelente custo-benefício.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                Nosso compromisso vai além da venda: buscamos garantir organização, transparência e um atendimento rápido e eficiente. Cada kit é montado com atenção aos detalhes, conferência rigorosa dos itens e embalagem adequada para garantir segurança e integridade dos produtos.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                Atendemos tanto clientes finais quanto empresas e órgãos públicos, com estrutura preparada para demandas maiores e prazos reduzidos. Prezamos pela responsabilidade, cumprimento de prazos e respeito aos nossos parceiros.
              </p>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Nossos Diferenciais</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Produtos selecionados com padrão de qualidade</span>
                </li>
                <li className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <span>Montagem cuidadosa e embalagem resistente</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <span>Entrega rápida e organizada</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Atendimento ágil e transparente</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Compromisso com prazos e necessidades do cliente</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                Na EJG Cesta Básica, trabalhamos todos os dias para levar praticidade, economia e confiança para nossos clientes.
              </p>
              <div className="mt-4 flex items-center gap-2 text-gray-900 font-semibold">
                <Phone className="h-5 w-5 text-primary" />
                <span>Contato: (16) 99202-5527</span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

