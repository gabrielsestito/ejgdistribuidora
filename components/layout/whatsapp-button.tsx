'use client'

import { useEffect, useState } from 'react'

export function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [hiddenOnPage, setHiddenOnPage] = useState(false)
  const [nearFooter, setNearFooter] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const phoneNumber = '5516992025527' // 16 99202-5527
  const message = encodeURIComponent('Olá! Gostaria de mais informações sobre os produtos.')

  useEffect(() => {
    // Mostrar botão após um pequeno delay para melhor UX
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const shouldHide =
        path.startsWith('/faq') ||
        path.startsWith('/legais') ||
        path.startsWith('/sac') ||
        path.startsWith('/sobre')
      setHiddenOnPage(shouldHide)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 380
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - threshold
      setNearFooter(atBottom)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  if (!isVisible || hiddenOnPage || nearFooter || dismissed) return null

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30 group"
      aria-label="Fale conosco no WhatsApp"
    >
      <span
        className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-black/60 text-white text-xs leading-5 text-center shadow cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          setDismissed(true)
        }}
        title="Fechar"
      >
        ×
      </span>
      {/* Tooltip com animação suave */}
      <div className="absolute bottom-full right-0 mb-3 px-3.5 py-2 bg-gray-900 text-white text-xs md:text-sm font-semibold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg transform translate-y-2 group-hover:translate-y-0">
        <div className="flex items-center gap-2">
          <span>💬</span>
          <span>Precisa de ajuda?</span>
        </div>
        <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900" />
      </div>

      {/* Botão principal com design moderno */}
      <div className="flex items-center gap-2 md:gap-3 bg-gradient-to-r from-[#25D366] to-[#20BA5A] hover:from-[#20BA5A] hover:to-[#1DA851] text-white rounded-full shadow-2xl hover:shadow-[#25D366]/60 transition-all duration-300 px-4 md:px-5 py-2.5 md:py-3 border-2 border-white/20">
        {/* Ícone WhatsApp SVG oficial */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="flex-shrink-0 drop-shadow-sm"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        
        {/* Texto */}
        <span className="font-bold text-xs md:text-sm tracking-wide">Fale conosco</span>
      </div>
    </button>
  )
}
