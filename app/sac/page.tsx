import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react'

export default function SACPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary" />
            SAC — Serviço de Atendimento ao Cliente
          </h1>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Canais de Atendimento</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  WhatsApp: (16) 99202-5527
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Telefone: (16) 2525-0014
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  E-mail: cestacompleta26@gmail.com
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Horário de Funcionamento</h2>
              <p className="text-gray-700">
                Segunda a Sexta: 8h às 17:45h 
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Sobre o Atendimento</h2>
              <p className="text-gray-700">
                Estamos à disposição para dúvidas sobre pedidos, entrega, pagamentos e produtos.
                Fale com a gente pelo canal de sua preferência e teremos prazer em ajudar.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
