"use client"

import type { MaterialResult } from "@/lib/excel-processor"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Calendar,
  ShoppingCart,
  Target,
  Layers,
  CalendarClock,
} from "lucide-react"

interface KPICardsProps {
  result: MaterialResult
}

function formatDate(date: Date | null): string {
  if (!date) return "--"
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR")
}

function StatusBadge({ status }: { status: MaterialResult["status"] }) {
  const config = {
    ok: {
      label: "Material OK",
      bg: "bg-[hsl(142,71%,45%)]/10",
      text: "text-[hsl(142,71%,45%)]",
      dot: "bg-[hsl(142,71%,45%)]",
    },
    warning: {
      label: "Atencao",
      bg: "bg-[hsl(48,96%,53%)]/10",
      text: "text-[hsl(48,96%,53%)]",
      dot: "bg-[hsl(48,96%,53%)]",
    },
    critical: {
      label: "Falta Confirmada",
      bg: "bg-[hsl(0,72%,51%)]/10",
      text: "text-[hsl(0,72%,51%)]",
      dot: "bg-[hsl(0,72%,51%)]",
    },
  }

  const c = config[status]

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${c.bg}`}>
      <div className={`h-2 w-2 rounded-full ${c.dot} ${status === "critical" ? "animate-pulse-glow" : ""}`} />
      <span className={`text-xs font-medium ${c.text}`}>{c.label}</span>
    </div>
  )
}

export function KPICards({ result }: KPICardsProps) {
  const cards = [
    {
      label: "Estoque Atual",
      value: formatNumber(result.estoqueAtual),
      icon: Package,
      accent: false,
    },
    {
      label: "Ponto de Pedido",
      value: formatNumber(result.pontoPedido),
      icon: Target,
      accent: false,
    },
    {
      label: "Total Empenhado",
      value: formatNumber(result.totalEmpenhado),
      icon: Layers,
      accent: false,
    },
    {
      label: "Pedido de Compra",
      value: formatNumber(result.pedidoCompra),
      icon: ShoppingCart,
      accent: false,
    },
    {
      label: "Saldo Projetado",
      value: formatNumber(result.saldoProjetado),
      icon: result.saldoProjetado < 0 ? TrendingDown : AlertTriangle,
      accent: result.saldoProjetado < 0,
    },
    {
      label: "Data da Falta",
      value: formatDate(result.dataFalta),
      icon: Calendar,
      accent: result.dataFalta !== null,
    },
    {
      label: "Sugestao Solicitacao",
      value: formatDate(result.dataSugestao),
      icon: CalendarClock,
      accent: result.dataSugestao !== null,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{result.descricao}</h2>
            <StatusBadge status={result.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{result.codigo}</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`animate-fade-in group flex flex-col gap-3 rounded-lg border p-4 transition-colors ${
                card.accent
                  ? "border-[hsl(0,72%,51%)]/30 bg-[hsl(0,72%,51%)]/5"
                  : "border-border bg-card hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${card.accent ? "text-[hsl(0,72%,51%)]" : "text-muted-foreground"}`}
                />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p
                className={`font-mono text-xl font-bold ${card.accent ? "text-[hsl(0,72%,51%)]" : "text-foreground"}`}
              >
                {card.value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
