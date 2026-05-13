"use client"

import { BarChart3 } from "lucide-react"

export function EmptyState({ type }: { type: "no-file" | "no-material" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary">
        <BarChart3 className="h-7 w-7 text-muted-foreground" />
      </div>
      {type === "no-file" ? (
        <>
          <h3 className="text-base font-semibold text-foreground">Nenhuma planilha carregada</h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground leading-relaxed">
            Faca upload de uma planilha Excel com as abas SD4 e MATERIAIS para comecar a analise de antecipacao de
            falta de material.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-foreground">Selecione um material</h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground leading-relaxed">
            Use o campo de busca acima para selecionar um codigo de material e visualizar o dashboard de antecipacao.
          </p>
        </>
      )}
    </div>
  )
}
