"use client"

import { useEffect } from "react"
import { useKatakuriStore } from "@/store/katakuri"
import { TICK_INTERVAL_MS } from "@/lib/yield"

export function YieldProvider({ children }: { children: React.ReactNode }) {
  const tickYield = useKatakuriStore((s) => s.tickYield)

  useEffect(() => {
    const interval = setInterval(() => {
      tickYield()
    }, TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [tickYield])

  return <>{children}</>
}
