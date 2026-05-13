"use client"

import { useState, useMemo, useCallback } from "react"
import type { OPConsumidora } from "@/lib/excel-processor"
import { Copy, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface OPsTableProps {
  ops: OPConsumidora[]
  estoqueAtual: number
  pedidoCompra: number
}

type SortField = "op" | "qtdEmpenho" | "dataPlano" | "status"
type SortDirection = "asc" | "desc"

function formatDate(date: Date | null): string {
  if (!date) return "--"
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function OPsTable({ ops, estoqueAtual, pedidoCompra }: OPsTableProps) {
  const [copied, setCopied] = useState(false)
  const [sortField, setSortField] = useState<SortField>("dataPlano")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const sorted = useMemo(() => {
    return [...ops].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1
      switch (sortField) {
        case "op":
          return dir * a.op.localeCompare(b.op)
        case "qtdEmpenho":
          return dir * (a.qtdEmpenho - b.qtdEmpenho)
        case "dataPlano": {
          if (!a.dataPlano) return 1
          if (!b.dataPlano) return -1
          return dir * (a.dataPlano.getTime() - b.dataPlano.getTime())
        }
        case "status":
          return dir * a.status.localeCompare(b.status)
        default:
          return 0
      }
    })
  }, [ops, sortField, sortDirection])

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
        return prev
      }
      setSortDirection("asc")
      return field
    })
  }, [])

  const handleCopy = useCallback(() => {
    const text = ops.map((op) => op.op).join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [ops])

  // Calculate running balance starting from estoque + pedidos
  let runningBalance = estoqueAtual + pedidoCompra

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-foreground" />
    ) : (
      <ArrowDown className="h-3 w-3 text-foreground" />
    )
  }

  const columns: { field: SortField; label: string }[] = [
    { field: "op", label: "OP" },
    { field: "dataPlano", label: "Data Plano" },
    { field: "qtdEmpenho", label: "Qtd Empenho" },
    { field: "status", label: "Status" },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">OPs Consumidoras</h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {ops.length}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[hsl(142,71%,45%)]" />
              <span className="text-[hsl(142,71%,45%)]">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar OPs</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-secondary">
              <tr>
                {columns.map(({ field, label }) => (
                  <th key={field} className="px-4 py-3 text-left">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => handleSort(field)}
                    >
                      {label}
                      <SortIcon field={field} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Saldo Corrente
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((op, i) => {
                runningBalance -= op.qtdEmpenho
                const isNegative = runningBalance < 0

                return (
                  <tr
                    key={`${op.op}-${i}`}
                    className={`transition-colors hover:bg-secondary/50 ${
                      isNegative ? "bg-[hsl(0,72%,51%)]/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-foreground">{op.op}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(op.dataPlano)}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">
                      {op.qtdEmpenho.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{op.status || "--"}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      <span className={isNegative ? "text-[hsl(0,72%,51%)]" : "text-[hsl(142,71%,45%)]"}>
                        {runningBalance.toLocaleString("pt-BR")}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
