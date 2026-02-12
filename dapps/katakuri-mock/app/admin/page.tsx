"use client"

import { CreateMarketForm } from "@/components/admin/create-market-form"
import { ResolveMarketPanel } from "@/components/admin/resolve-market-panel"

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage prediction markets on Sui Testnet
        </p>
      </div>

      <CreateMarketForm />
      <ResolveMarketPanel />
    </div>
  )
}
