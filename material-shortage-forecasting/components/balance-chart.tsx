"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts"
import type { ConsumoAcumulado } from "@/lib/excel-processor"

interface BalanceChartProps {
  data: ConsumoAcumulado[]
  pontoPedido: number
}

export function BalanceChart({ data, pontoPedido }: BalanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground">Sem dados de consumo para exibir</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    data: d.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    saldo: d.saldo,
    consumo: d.consumoAcumulado,
  }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Projecao de Saldo</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[hsl(217,91%,60%)]" />
            <span className="text-xs text-muted-foreground">Saldo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 border-t border-dashed border-[hsl(48,96%,53%)]" />
            <span className="text-xs text-muted-foreground">Ponto de Pedido</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(0, 0%, 14%)"
              vertical={false}
            />
            <XAxis
              dataKey="data"
              tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(0, 0%, 14%)" }}
            />
            <YAxis
              tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 4%)",
                border: "1px solid hsl(0, 0%, 14%)",
                borderRadius: "8px",
                color: "hsl(0, 0%, 93%)",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(0, 0%, 55%)" }}
            />
            <ReferenceLine
              y={pontoPedido}
              stroke="hsl(48, 96%, 53%)"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{
                value: `PP: ${pontoPedido}`,
                fill: "hsl(48, 96%, 53%)",
                fontSize: 11,
                position: "right",
              }}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(0, 72%, 51%)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fill="url(#saldoGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "hsl(217, 91%, 60%)",
                stroke: "hsl(0, 0%, 4%)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
