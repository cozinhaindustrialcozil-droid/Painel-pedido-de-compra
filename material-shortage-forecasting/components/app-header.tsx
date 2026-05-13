"use client"

import { Activity } from "lucide-react"

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
          <Activity className="h-4 w-4 text-background" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">PCP Forecast</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Beta
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-1.5 sm:flex">
          <div className="h-1.5 w-1.5 rounded-full bg-[hsl(142,71%,45%)]" />
          <span className="text-xs text-muted-foreground">Sistema Ativo</span>
        </div>
      </div>
    </header>
  )
}
