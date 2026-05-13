import * as XLSX from "xlsx"

// Status values to EXCLUDE from calculations (Column K)
// "comercial" agora é CONSIDERADO (removido da lista de exclusão)
// Apenas: logistica, qualidade, expedição, finalizada e #N/D são excluídos
const EXCLUDED_STATUS = [
  "logistica",
  "logística",
  "qualidade",
  "expedicao",
  "expedição",
  "finalizada",
]

/**
 * SD4 Row structure mapped by COLUMN POSITION:
 * B = ARRUMAR       -> Codigo do material (campo principal de busca)
 * D = DESCRICAO     -> Descricao do material
 * F = CONCATENA     -> OP que consome o material
 * H = DATA_DO_PLANO -> Data prevista de consumo
 * K = Coluna1       -> STATUS (usado para filtro)
 * M = ESTOQUE       -> Estoque atual
 * N = PC            -> Pedido de compra (quantidade)
 * O = DATA_PC       -> Data prevista de chegada do PC
 */
export interface SD4Row {
  ARRUMAR: string
  DESCRICAO: string
  CONCATENA: string
  DATA_DO_PLANO: string | Date | number
  STATUS: string
  STATUS_IS_ERROR: boolean // Flag if column K is an Excel error (#N/D, #N/A, etc.)
  ESTOQUE: number
  PC: number
  DATA_PC: string | Date | number
  QTD_EMPENHO: number
}

export interface MaterialRow {
  Codigo: string
  PP: number
}

export interface ParsedData {
  sd4: SD4Row[]
  materiais: MaterialRow[]
}

export interface MaterialResult {
  codigo: string
  descricao: string
  estoqueAtual: number
  pontoPedido: number
  totalEmpenhado: number
  pedidoCompra: number
  saldoProjetado: number
  dataFalta: Date | null
  dataSugestao: Date | null
  status: "ok" | "warning" | "critical"
  opsConsumidoras: OPConsumidora[]
  consumoAcumulado: ConsumoAcumulado[]
}

export interface OPConsumidora {
  op: string
  qtdEmpenho: number
  dataPlano: Date | null
  status: string
}

export interface ConsumoAcumulado {
  data: Date
  consumoAcumulado: number
  saldo: number
}

function parseDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) return new Date(date.y, date.m - 1, date.d)
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed || trimmed.startsWith("#") || trimmed === "-") return null
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) return parsed
  }
  return null
}

/**
 * Reads a cell directly from the sheet to check its type.
 * This is the ONLY reliable way to detect Excel errors like #N/D, #N/A.
 *
 * XLSX cell types:
 * - 'e' = error (#N/D, #N/A, #REF!, #VALUE!, etc.)
 * - 's' = string
 * - 'n' = number
 * - 'b' = boolean
 * - 'd' = date
 */
function getCellInfo(
  sheet: XLSX.WorkSheet,
  row: number,
  col: number
): { value: unknown; isError: boolean; errorText: string } {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = sheet[cellRef]

  if (!cell) {
    return { value: "", isError: false, errorText: "" }
  }

  // Cell type 'e' means it's an Excel error value
  if (cell.t === "e") {
    return {
      value: cell.w || cell.v || "",
      isError: true,
      errorText: cell.w || String(cell.v) || "#ERROR",
    }
  }

  // Return the formatted/raw value
  return {
    value: cell.v !== undefined ? cell.v : "",
    isError: false,
    errorText: "",
  }
}

/**
 * Reads the SD4 sheet CELL BY CELL to properly detect Excel errors.
 * Column positions: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14
 */
function parseSD4(sheet: XLSX.WorkSheet): SD4Row[] {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1")
  const rows: SD4Row[] = []

  // Start from row 1 (skip header at row 0)
  for (let rowIdx = range.s.r + 1; rowIdx <= range.e.r; rowIdx++) {
    // Col B (index 1) = ARRUMAR (material code) - this is the KEY column
    const colB = getCellInfo(sheet, rowIdx, 1)
    const arrumar = String(colB.value ?? "").trim()
    if (!arrumar) continue // Skip rows without material code

    // Col D (index 3) = DESCRICAO
    const colD = getCellInfo(sheet, rowIdx, 3)
    const descricao = String(colD.value ?? "").trim()

    // Col F (index 5) = CONCATENA (OP)
    const colF = getCellInfo(sheet, rowIdx, 5)
    const concatena = String(colF.value ?? "").trim()

    // Col H (index 7) = DATA_DO_PLANO
    const colH = getCellInfo(sheet, rowIdx, 7)
    const dataDoPlano = colH.value

    // Col K (index 10) = STATUS - THIS IS WHERE #N/D ERRORS LIVE
    const colK = getCellInfo(sheet, rowIdx, 10)
    const statusIsError = colK.isError
    const statusText = statusIsError
      ? colK.errorText
      : String(colK.value ?? "").trim()

    // Col M (index 12) = ESTOQUE
    const colM = getCellInfo(sheet, rowIdx, 12)
    const estoque = Number(colM.value) || 0

    // Col N (index 13) = PC (Pedido de Compra)
    const colN = getCellInfo(sheet, rowIdx, 13)
    const pc = Number(colN.value) || 0

    // Col O (index 14) = DATA_PC
    const colO = getCellInfo(sheet, rowIdx, 14)
    const dataPc = colO.value

    // Qty empenho - try col G (index 6) first, then default to 1
    const colG = getCellInfo(sheet, rowIdx, 6)
    const qtdEmpenho = Number(colG.value) || 1

    rows.push({
      ARRUMAR: arrumar,
      DESCRICAO: descricao,
      CONCATENA: concatena,
      DATA_DO_PLANO: dataDoPlano as string | Date | number,
      STATUS: statusText,
      STATUS_IS_ERROR: statusIsError,
      ESTOQUE: estoque,
      PC: pc,
      DATA_PC: dataPc as string | Date | number,
      QTD_EMPENHO: qtdEmpenho,
    })
  }

  return rows
}

function normalizeColumnName(name: string): string {
  return name
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[áàâã]/gi, "A")
    .replace(/[éèê]/gi, "E")
    .replace(/[íìî]/gi, "I")
    .replace(/[óòôõ]/gi, "O")
    .replace(/[úùû]/gi, "U")
    .replace(/[ç]/gi, "C")
}

/**
 * REGRA DE EXCLUSAO - Uma linha e EXCLUIDA se:
 * 1. A coluna K e um erro do Excel (STATUS_IS_ERROR === true) -> ex: #N/D, #N/A
 * 2. A coluna K esta vazia
 * 3. A coluna K contem um dos textos bloqueados (Comercial, Logistica, etc.)
 * 4. A coluna K contem texto que comeca com # (qualquer erro)
 *
 * Apenas linhas com status VALIDO de producao ativa sao consideradas.
 */
function isRowExcluded(row: SD4Row): boolean {
  // Rule 1: If the cell was detected as an Excel error -> EXCLUDE
  if (row.STATUS_IS_ERROR) return true

  const status = row.STATUS.toLowerCase().trim()

  // Rule 2: Empty status -> EXCLUDE
  if (!status) return true

  // Rule 3: Any text starting with # -> EXCLUDE (catches #N/D, #N/A, #REF!, etc.)
  if (status.startsWith("#")) return true

  // Rule 4: Blocked text values -> EXCLUDE
  for (const blocked of EXCLUDED_STATUS) {
    if (status.includes(blocked)) return true
  }

  // If none of the above, the row is VALID (active production)
  return false
}

export function parseExcelFile(buffer: ArrayBuffer): ParsedData {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })

  // Find SD4 sheet
  const sd4SheetName = workbook.SheetNames.find((name) =>
    name.toUpperCase().includes("SD4")
  )
  if (!sd4SheetName) {
    throw new Error(
      'Aba "SD4" nao encontrada na planilha. Abas disponiveis: ' +
        workbook.SheetNames.join(", ")
    )
  }

  // Find MATERIAIS sheet
  const materiaisSheetName = workbook.SheetNames.find(
    (name) =>
      name.toUpperCase().includes("MATERIAIS") ||
      name.toUpperCase().includes("MATERIAL")
  )
  if (!materiaisSheetName) {
    throw new Error(
      'Aba "MATERIAIS" nao encontrada na planilha. Abas disponiveis: ' +
        workbook.SheetNames.join(", ")
    )
  }

  const sd4Sheet = workbook.Sheets[sd4SheetName]
  const materiaisSheet = workbook.Sheets[materiaisSheetName]

  // Parse SD4 cell-by-cell for reliable error detection
  const sd4 = parseSD4(sd4Sheet)

  // Parse MATERIAIS sheet
  const materiaisRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    materiaisSheet,
    { defval: "" }
  )

  const materiais: MaterialRow[] = materiaisRaw.map((row) => {
    const normalized: Record<string, unknown> = {}
    for (const key of Object.keys(row)) {
      normalized[normalizeColumnName(key)] = row[key]
    }
    return {
      Codigo: String(
        normalized.CODIGO || normalized.COD || normalized.MATERIAL || ""
      ).trim(),
      PP:
        Number(
          normalized.PP ||
            normalized.PONTO_PEDIDO ||
            normalized.PONTO_DE_PEDIDO
        ) || 0,
    }
  })

  if (sd4.length === 0) {
    throw new Error(
      "Nenhuma linha valida encontrada na aba SD4. Verifique se a coluna B (ARRUMAR) contem codigos de material."
    )
  }

  // Debug: show parse stats
  const errorCount = sd4.filter((r) => r.STATUS_IS_ERROR).length
  const uniqueStatuses = [...new Set(sd4.map((r) => (r.STATUS_IS_ERROR ? `[ERROR]${r.STATUS}` : r.STATUS)))]
  console.log("[v0] SD4 parsed:", sd4.length, "total rows")
  console.log("[v0] Rows with Excel error in Col K:", errorCount)
  console.log("[v0] Unique statuses:", uniqueStatuses)

  return { sd4, materiais }
}

export function calculateMaterial(
  data: ParsedData,
  materialCode: string
): MaterialResult | null {
  const code = materialCode.trim()

  // 1. Find all rows in SD4 where ARRUMAR (Col B) = material code
  const allRows = data.sd4.filter((row) => row.ARRUMAR === code)
  if (allRows.length === 0) return null

  // ========================================================
  // STEP 1: FILTER STATUS FIRST (before any calculation)
  // ========================================================
  const excludedRows = allRows.filter((row) => isRowExcluded(row))
  const validRows = allRows.filter((row) => !isRowExcluded(row))

  console.log("[v0] ===== Material:", code, "=====")
  console.log("[v0] Total rows for this material:", allRows.length)
  console.log(
    "[v0] EXCLUDED rows:",
    excludedRows.length,
    "->",
    excludedRows.map((r) => `OP:${r.CONCATENA} status:"${r.STATUS}" isError:${r.STATUS_IS_ERROR} empenho:${r.QTD_EMPENHO}`).join(" | ")
  )
  console.log(
    "[v0] VALID rows:",
    validRows.length,
    "->",
    validRows.map((r) => `OP:${r.CONCATENA} status:"${r.STATUS}" empenho:${r.QTD_EMPENHO}`).join(" | ")
  )

  // 3. Get description from first row (Col D)
  const descricao = allRows[0]?.DESCRICAO || "Sem descricao"

  // 4. Get estoque from first row (Col M) - same for all rows of same material
  const estoqueAtual = allRows[0]?.ESTOQUE || 0

  // ========================================================
  // STEP: PEDIDO DE COMPRA - DEDUPLICATE before summing!
  // The same PC value appears on EVERY OP line for that material.
  // We must count each unique PC only ONCE.
  // Dedup key: PC quantity + PC date (to distinguish different orders)
  // ========================================================
  const pcSeen = new Set<string>()
  let pedidoCompra = 0
  for (const row of allRows) {
    if (row.PC > 0) {
      // Build a unique key from PC value + PC date to identify the same order
      const dateStr = row.DATA_PC
        ? String(row.DATA_PC instanceof Date ? row.DATA_PC.toISOString() : row.DATA_PC)
        : "no-date"
      const pcKey = `${row.PC}|${dateStr}`
      if (!pcSeen.has(pcKey)) {
        pcSeen.add(pcKey)
        pedidoCompra += row.PC
      }
    }
  }
  console.log("[v0] PC unique keys found:", [...pcSeen], "-> Total PC:", pedidoCompra)

  // 6. Get Ponto de Pedido from MATERIAIS sheet
  const materialInfo = data.materiais.find((m) => m.Codigo === code)
  const pontoPedido = materialInfo?.PP || 0

  // ========================================================
  // STEP 2: CALCULATE EMPENHOS (only from VALID rows)
  // ========================================================
  const totalEmpenhado = validRows.reduce(
    (sum, row) => sum + row.QTD_EMPENHO,
    0
  )

  console.log("[v0] Estoque:", estoqueAtual, "PC:", pedidoCompra, "PP:", pontoPedido)
  console.log("[v0] Total empenhado (only valid):", totalEmpenhado)

  // ========================================================
  // STEP 3: BUILD OPs LIST (only from VALID rows)
  // ========================================================
  const opsConsumidoras: OPConsumidora[] = validRows
    .map((row) => ({
      op: row.CONCATENA,
      qtdEmpenho: row.QTD_EMPENHO,
      dataPlano: parseDate(row.DATA_DO_PLANO),
      status: row.STATUS,
    }))
    .sort((a, b) => {
      if (!a.dataPlano) return 1
      if (!b.dataPlano) return -1
      return a.dataPlano.getTime() - b.dataPlano.getTime()
    })

  // ========================================================
  // STEP 4: CALCULATE SALDO (only from VALID rows)
  // ========================================================
  const saldoProjetado =
    estoqueAtual + pedidoCompra - totalEmpenhado - pontoPedido

  let saldoCorrente = estoqueAtual + pedidoCompra
  let dataFalta: Date | null = null
  const consumoAcumulado: ConsumoAcumulado[] = []
  let acumulado = 0

  for (const op of opsConsumidoras) {
    acumulado += op.qtdEmpenho
    saldoCorrente -= op.qtdEmpenho

    if (op.dataPlano) {
      consumoAcumulado.push({
        data: op.dataPlano,
        consumoAcumulado: acumulado,
        saldo: saldoCorrente,
      })
    }

    if (saldoCorrente < 0 && !dataFalta && op.dataPlano) {
      dataFalta = op.dataPlano
    }
  }

  console.log("[v0] Saldo projetado:", saldoProjetado, "Data falta:", dataFalta)

  // Data sugerida = Data da Falta - 7 dias
  let dataSugestao: Date | null = null
  if (dataFalta) {
    dataSugestao = new Date(dataFalta)
    dataSugestao.setDate(dataSugestao.getDate() - 7)
  }

  // Determine status
  let status: "ok" | "warning" | "critical" = "ok"
  if (saldoProjetado < 0) {
    status = "critical"
  } else if (pontoPedido > 0 && saldoProjetado <= pontoPedido * 1.2) {
    status = "warning"
  }

  return {
    codigo: code,
    descricao,
    estoqueAtual,
    pontoPedido,
    totalEmpenhado,
    pedidoCompra,
    saldoProjetado,
    dataFalta,
    dataSugestao,
    status,
    opsConsumidoras,
    consumoAcumulado,
  }
}

export function getAvailableMaterials(data: ParsedData): string[] {
  const materials = new Set<string>()
  for (const row of data.sd4) {
    if (row.ARRUMAR) materials.add(row.ARRUMAR)
  }
  return Array.from(materials).sort()
}
