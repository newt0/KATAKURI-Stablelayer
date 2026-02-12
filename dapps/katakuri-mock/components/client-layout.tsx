"use client"

import { Header } from "@/components/header"
import { YieldProvider } from "@/components/yield-provider"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <YieldProvider>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </YieldProvider>
  )
}
