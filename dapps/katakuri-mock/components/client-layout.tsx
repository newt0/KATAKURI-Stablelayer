"use client"

import { Header } from "@/components/header"
import { SuiProvider } from "@/components/providers/sui-provider"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuiProvider>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </SuiProvider>
  )
}
