"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, ChevronDown } from "lucide-react"

interface MaterialSearchProps {
  materials: string[]
  selectedMaterial: string
  onSelect: (material: string) => void
}

export function MaterialSearch({ materials, selectedMaterial, onSelect }: MaterialSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query) return materials.slice(0, 50)
    return materials.filter((m) => m.toLowerCase().includes(query.toLowerCase())).slice(0, 50)
  }, [materials, query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 transition-colors ${
          isOpen ? "border-foreground/30" : "border-border hover:border-muted-foreground/30"
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar codigo do material..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {selectedMaterial && (
          <span className="shrink-0 rounded bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">
            {selectedMaterial}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-card shadow-2xl shadow-background/80">
          {filtered.map((material) => (
            <button
              key={material}
              type="button"
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${
                material === selectedMaterial ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => {
                onSelect(material)
                setQuery("")
                setIsOpen(false)
              }}
            >
              <span className="font-mono text-xs">{material}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && filtered.length === 0 && query && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-card p-4 text-center shadow-2xl">
          <p className="text-sm text-muted-foreground">Nenhum material encontrado</p>
        </div>
      )}
    </div>
  )
}
