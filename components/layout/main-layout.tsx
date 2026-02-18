'use client'

import { Header } from './header'
import { WhatsAppButton } from './whatsapp-button'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <WhatsAppButton />
    </>
  )
}
