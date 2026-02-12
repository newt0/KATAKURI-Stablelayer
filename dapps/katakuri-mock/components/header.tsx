"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useKatakuriStore } from "@/store/katakuri"
import { formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Matches" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/admin", label: "Admin" },
]

export function Header() {
  const pathname = usePathname()
  const balances = useKatakuriStore((s) => s.balances)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            KATAKURI
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">USDC</span>
            <span className="font-semibold tabular-nums text-foreground">
              ${formatUsd(balances.usdc)}
            </span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-muted-foreground">kUSD</span>
            <span className="font-semibold tabular-nums text-foreground">
              ${formatUsd(balances.katakuriUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex border-t border-border md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 py-2 text-center text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-foreground text-background"
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
