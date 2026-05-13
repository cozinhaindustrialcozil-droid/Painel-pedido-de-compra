"use client"

import React from "react"

import { useCallback, useState } from "react"
import { Upload, FileSpreadsheet, X, CheckCircle2 } from "lucide-react"

interface FileUploadProps {
  onFileLoaded: (buffer: ArrayBuffer) => void
  isLoading: boolean
  hasData: boolean
}

export function FileUpload({ onFileLoaded, isLoading, hasData }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const processFile = useCallback(
    (file: File) => {
      if (
        !file.name.endsWith(".xlsx") &&
        !file.name.endsWith(".xls") &&
        !file.name.endsWith(".csv")
      ) {
        alert("Formato invalido. Envie um arquivo .xlsx ou .xls")
        return
      }
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer
        onFileLoaded(buffer)
      }
      reader.readAsArrayBuffer(file)
    },
    [onFileLoaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleClear = useCallback(() => {
    setFileName(null)
  }, [])

  return (
    <div
      className={`relative rounded-lg border border-dashed transition-all duration-200 ${
        isDragOver
          ? "border-foreground bg-secondary"
          : hasData
            ? "border-[hsl(142,71%,45%)] bg-[hsl(142,71%,45%)]/5"
            : "border-border hover:border-muted-foreground/50 hover:bg-secondary/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <label className="flex cursor-pointer flex-col items-center gap-3 p-8">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          onChange={handleChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-foreground">Processando planilha...</p>
              <p className="text-xs text-muted-foreground">Aguarde enquanto analisamos os dados</p>
            </div>
          </>
        ) : hasData && fileName ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(142,71%,45%)]/30 bg-[hsl(142,71%,45%)]/10">
              <CheckCircle2 className="h-5 w-5 text-[hsl(142,71%,45%)]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[hsl(142,71%,45%)]" />
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleClear()
                  }}
                  className="rounded-full p-0.5 hover:bg-secondary"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Planilha carregada com sucesso. Clique para substituir.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-foreground">
                Arraste sua planilha Excel aqui
              </p>
              <p className="text-xs text-muted-foreground">
                ou clique para selecionar o arquivo .xlsx
              </p>
            </div>
          </>
        )}
      </label>
    </div>
  )
}
