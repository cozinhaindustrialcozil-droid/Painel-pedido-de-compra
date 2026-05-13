"use client"

import { useState, useCallback, useMemo } from "react"
import { AppHeader } from "@/components/app-header"
import { FileUpload } from "@/components/file-upload"
import { MaterialSearch } from "@/components/material-search"
import { KPICards } from "@/components/kpi-cards"
import { OPsTable } from "@/components/ops-table"
import { BalanceChart } from "@/components/balance-chart"
import { EmptyState } from "@/components/empty-state"
import {
  parseExcelFile,
  calculateMaterial,
  getAvailableMaterials,
  type ParsedData,
  type MaterialResult,
} from "@/lib/excel-processor"
import { AlertCircle } from "lucide-react"

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const materials = useMemo(() => {
    if (!parsedData) return []
    return getAvailableMaterials(parsedData)
  }, [parsedData])

  const result: MaterialResult | null = useMemo(() => {
    if (!parsedData || !selectedMaterial) return null
    return calculateMaterial(parsedData, selectedMaterial)
  }, [parsedData, selectedMaterial])

  const handleFileLoaded = useCallback((buffer: ArrayBuffer) => {
    setIsLoading(true)
    setError(null)
    setSelectedMaterial("")

    setTimeout(() => {
      try {
        const data = parseExcelFile(buffer)
        setParsedData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao processar a planilha")
      } finally {
        setIsLoading(false)
      }
    }, 100)
  }, [])

  const handleSelectMaterial = useCallback((material: string) => {
    setSelectedMaterial(material)
    setError(null)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        {/* Upload & Search Row */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Planilha Excel
            </label>
            <FileUpload
              onFileLoaded={handleFileLoaded}
              isLoading={isLoading}
              hasData={parsedData !== null}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Material
            </label>
            <MaterialSearch
              materials={materials}
              selectedMaterial={selectedMaterial}
              onSelect={handleSelectMaterial}
            />
            {parsedData && (
              <p className="text-xs text-muted-foreground">
                {materials.length} materiais encontrados na planilha
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-[hsl(0,72%,51%)]/30 bg-[hsl(0,72%,51%)]/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[hsl(0,72%,51%)]" />
            <p className="text-sm text-[hsl(0,72%,51%)]">{error}</p>
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-border" />

        {/* Content */}
        {!parsedData && !isLoading && <EmptyState type="no-file" />}

        {parsedData && !selectedMaterial && <EmptyState type="no-material" />}

        {result && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* KPI Cards */}
            <KPICards result={result} />

            {/* Chart + Table */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BalanceChart
                data={result.consumoAcumulado}
                pontoPedido={result.pontoPedido}
              />
              <OPsTable
                ops={result.opsConsumidoras}
                estoqueAtual={result.estoqueAtual}
                pedidoCompra={result.pedidoCompra}
              />
            </div>
          </div>
        )}

        {selectedMaterial && !result && parsedData && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[hsl(48,96%,53%)]/30 bg-[hsl(48,96%,53%)]/10">
              <AlertCircle className="h-7 w-7 text-[hsl(48,96%,53%)]" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Material nao encontrado</h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground leading-relaxed">
              O codigo <span className="font-mono text-foreground">{selectedMaterial}</span> nao foi
              encontrado na coluna ARRUMAR (Col B) da aba SD4. Verifique o codigo e tente novamente.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-xs text-muted-foreground">
            PCP Material Forecast
          </p>
          <p className="text-xs text-muted-foreground">
            Antecipacao de falta de material
          </p>
        </div>
      </footer>
    </div>
  )
}
