import Link from 'next/link'
import { Phone, Mail, MapPin, Package, User, FileText, MessageCircle, Home, ShoppingCart, HelpCircle } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const whatsappNumber = '16992025527'
  const whatsappLink = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de mais informações.')}`

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Sobre */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              EJG Distribuidora
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Cestas básicas de qualidade com entrega rápida e preço justo. 
              Sua família merece o melhor!
            </p>
            <div className="flex gap-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#25D366] hover:bg-[#20BA5A] rounded-full flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-bold text-lg mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group">
                  <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link href="/cestas" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group">
                  <Package className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Nossas Cestas
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group">
                  <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Sobre a EJG
                </Link>
              </li>
              <li>
                <Link href="/carrinho" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group">
                  <ShoppingCart className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Meu Carrinho
                </Link>
              </li>
              <li>
                <Link href="/acompanhar" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group">
                  <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Acompanhar Pedido
                </Link>
              </li>
              <li>
                <Link href="/conta" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group">
                  <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Minha Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-[#25D366] transition-colors flex items-center gap-2 group"
                >
                  <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>(16) 99202-5527</span>
                </a>
              </li>
              <li className="text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">R. Ribeirão Preto, 2239 - Vila Elisa, Ribeirão Preto - SP, 14075-080</span>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-bold text-lg mb-4">Suporte</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-[#25D366] transition-colors flex items-center gap-2 group"
                >
                  <HelpCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Central de Ajuda
                </a>
              </li>
              <li>
                <Link
                  href="/sac"
                  className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  SAC
                </Link>
              </li>
              <li className="text-gray-300 text-sm">
                Entrega rápida e segura
              </li>
              <li className="text-gray-300 text-sm">
                Produtos de qualidade
              </li>
              <li className="text-gray-300 text-sm">
                Atendimento personalizado
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              &copy; {currentYear} EJG Distribuidora. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/faq" className="text-gray-400 hover:text-primary transition-colors">
                FAQ
              </Link>
              <Link href="/legais/politicas" className="text-gray-400 hover:text-primary transition-colors">
                Políticas
              </Link>
              <Link href="/legais/termos" className="text-gray-400 hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link href="/sac" className="text-gray-400 hover:text-primary transition-colors">
                SAC
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

