import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { AgencySettings } from '../supabase'

const A4 = { width: 595.28, height: 841.89 } // points
const MARGIN = { top: 56, bottom: 56, left: 56, right: 56 }

const COLORS = {
  black: rgb(0.05, 0.05, 0.05),
  dark: rgb(0.15, 0.15, 0.18),
  gray: rgb(0.45, 0.45, 0.5),
  light: rgb(0.7, 0.7, 0.72),
  lime: rgb(0.78, 0.9, 0.29),
  border: rgb(0.85, 0.85, 0.88),
}

/**
 * Wrapper a flusso verticale: tiene traccia della posizione corrente, gestisce
 * la creazione di nuove pagine, fornisce primitive per scrivere paragrafi/header.
 */
export class PdfBuilder {
  private doc: PDFDocument
  private regular!: PDFFont
  private bold!: PDFFont
  private page!: PDFPage
  private cursorY: number = 0
  private agency: AgencySettings | null
  private docTitle: string

  private constructor(doc: PDFDocument, agency: AgencySettings | null, title: string) {
    this.doc = doc
    this.agency = agency
    this.docTitle = title
  }

  static async create(opts: { title: string; agency: AgencySettings | null }): Promise<PdfBuilder> {
    const doc = await PDFDocument.create()
    doc.setTitle(opts.title)
    doc.setProducer('Victor & Co CRM')
    doc.setCreator('Victor & Co CRM')
    const builder = new PdfBuilder(doc, opts.agency, opts.title)
    builder.regular = await doc.embedFont(StandardFonts.Helvetica)
    builder.bold = await doc.embedFont(StandardFonts.HelveticaBold)
    builder.newPage()
    return builder
  }

  private addHeader(): void {
    const a = this.agency
    // Banda intestazione agenzia
    const headerY = A4.height - 32
    if (a?.full_name) {
      this.page.drawText(a.full_name, {
        x: MARGIN.left, y: headerY, font: this.bold, size: 10, color: COLORS.dark,
      })
    }
    const sedeParts = [a?.sede_legale_via, a?.sede_legale_cap, a?.sede_legale_citta].filter(Boolean).join(', ')
    if (sedeParts) {
      this.page.drawText(sedeParts, {
        x: MARGIN.left, y: headerY - 12, font: this.regular, size: 8, color: COLORS.gray,
      })
    }
    const idParts = [
      a?.partita_iva && `P.IVA ${a.partita_iva}`,
      a?.rea && `REA ${a.camera_commercio || ''} ${a.rea}`.trim(),
      a?.iscrizione_fiaip && `FIAIP n. ${a.iscrizione_fiaip}`,
    ].filter(Boolean).join(' · ')
    if (idParts) {
      this.page.drawText(idParts, {
        x: MARGIN.left, y: headerY - 22, font: this.regular, size: 8, color: COLORS.gray,
      })
    }
    // Linea separatrice
    this.page.drawLine({
      start: { x: MARGIN.left, y: headerY - 30 },
      end: { x: A4.width - MARGIN.right, y: headerY - 30 },
      thickness: 0.5, color: COLORS.border,
    })
  }

  private addFooter(): void {
    const footerY = 32
    this.page.drawLine({
      start: { x: MARGIN.left, y: footerY + 14 },
      end: { x: A4.width - MARGIN.right, y: footerY + 14 },
      thickness: 0.3, color: COLORS.border,
    })
    const left = `${this.docTitle} — Generato il ${new Date().toLocaleDateString('it-IT')}`
    this.page.drawText(left, {
      x: MARGIN.left, y: footerY, font: this.regular, size: 7, color: COLORS.gray,
    })
    const idx = this.doc.getPageCount()
    const totalLabel = `Pagina ${idx}`
    const w = this.regular.widthOfTextAtSize(totalLabel, 7)
    this.page.drawText(totalLabel, {
      x: A4.width - MARGIN.right - w, y: footerY, font: this.regular, size: 7, color: COLORS.gray,
    })
  }

  private newPage(): void {
    this.page = this.doc.addPage([A4.width, A4.height])
    this.addHeader()
    this.addFooter()
    this.cursorY = A4.height - 100 // sotto l'header
  }

  /** Spazio rimanente dalla cursorY al margin bottom. */
  private spaceLeft(): number {
    return this.cursorY - MARGIN.bottom - 20 /* footer */
  }

  /** Assicura che ci sia almeno `needed` punti, altrimenti nuova pagina. */
  private ensureSpace(needed: number): void {
    if (this.spaceLeft() < needed) this.newPage()
  }

  /** Wrap di una stringa lunga su righe basate sulla larghezza della pagina. */
  private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w
      const wW = font.widthOfTextAtSize(test, size)
      if (wW > maxWidth && cur) {
        lines.push(cur)
        cur = w
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    return lines
  }

  // ── Primitive di alto livello ────────────────────────────────────────────

  title(text: string): void {
    this.ensureSpace(40)
    const size = 16
    this.page.drawText(text, {
      x: MARGIN.left, y: this.cursorY, font: this.bold, size, color: COLORS.dark,
    })
    this.cursorY -= 22
    // Linea verde lime sotto il titolo
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.cursorY + 6 },
      end: { x: MARGIN.left + 80, y: this.cursorY + 6 },
      thickness: 1.5, color: COLORS.lime,
    })
    this.cursorY -= 12
  }

  subtitle(text: string): void {
    this.ensureSpace(30)
    const size = 11
    this.page.drawText(text.toUpperCase(), {
      x: MARGIN.left, y: this.cursorY, font: this.bold, size, color: COLORS.dark,
    })
    this.cursorY -= 18
  }

  /** Paragrafo a flusso (giustificato a sinistra), wrap automatico. */
  paragraph(text: string, opts?: { size?: number; bold?: boolean; spaceAfter?: number }): void {
    const size = opts?.size ?? 10
    const font = opts?.bold ? this.bold : this.regular
    const maxWidth = A4.width - MARGIN.left - MARGIN.right
    const lines = this.wrapText(text, font, size, maxWidth)
    const lineH = size * 1.4
    for (const line of lines) {
      this.ensureSpace(lineH)
      this.page.drawText(line, { x: MARGIN.left, y: this.cursorY, font, size, color: COLORS.dark })
      this.cursorY -= lineH
    }
    this.cursorY -= opts?.spaceAfter ?? 4
  }

  /** Riga "Etichetta: Valore" (label grigia, valore nero). */
  labelValue(label: string, value: string): void {
    const size = 10
    this.ensureSpace(16)
    const labelText = `${label}:`
    this.page.drawText(labelText, {
      x: MARGIN.left, y: this.cursorY, font: this.regular, size, color: COLORS.gray,
    })
    const labelW = this.regular.widthOfTextAtSize(labelText + ' ', size)
    const maxW = A4.width - MARGIN.left - MARGIN.right - labelW
    const lines = this.wrapText(value || '_______________________', this.bold, size, maxW)
    let y = this.cursorY
    lines.forEach((line, i) => {
      this.page.drawText(line, {
        x: MARGIN.left + labelW, y, font: this.bold, size, color: COLORS.dark,
      })
      if (i < lines.length - 1) y -= size * 1.4
    })
    this.cursorY = y - 16
  }

  /** Tabella semplice 2 colonne (etichetta | valore). */
  twoColumnTable(rows: { label: string; value: string }[]): void {
    const colLabelW = 180
    const size = 10
    const lineH = 14
    for (const r of rows) {
      this.ensureSpace(lineH + 4)
      this.page.drawText(r.label, {
        x: MARGIN.left, y: this.cursorY, font: this.regular, size, color: COLORS.gray,
      })
      const valueX = MARGIN.left + colLabelW
      const maxW = A4.width - MARGIN.right - valueX
      const valueLines = this.wrapText(r.value || '—', this.bold, size, maxW)
      let y = this.cursorY
      for (const line of valueLines) {
        this.page.drawText(line, { x: valueX, y, font: this.bold, size, color: COLORS.dark })
        y -= lineH
      }
      this.cursorY = Math.min(this.cursorY - lineH, y)
      // Separatore sottile
      this.page.drawLine({
        start: { x: MARGIN.left, y: this.cursorY + 4 },
        end: { x: A4.width - MARGIN.right, y: this.cursorY + 4 },
        thickness: 0.2, color: COLORS.border,
      })
      this.cursorY -= 4
    }
    this.cursorY -= 8
  }

  /** Checkbox con etichetta. */
  checkbox(label: string, checked: boolean): void {
    const size = 10
    const boxSize = 9
    this.ensureSpace(16)
    // box
    this.page.drawRectangle({
      x: MARGIN.left, y: this.cursorY - 1,
      width: boxSize, height: boxSize,
      borderColor: COLORS.dark, borderWidth: 0.7,
    })
    if (checked) {
      this.page.drawText('X', {
        x: MARGIN.left + 1.5, y: this.cursorY,
        font: this.bold, size: 8, color: COLORS.dark,
      })
    }
    this.page.drawText(label, {
      x: MARGIN.left + boxSize + 6, y: this.cursorY,
      font: this.regular, size, color: COLORS.dark,
    })
    this.cursorY -= 16
  }

  /** Spazio per firma (linea + label). */
  signatureLine(label: string, opts?: { rightAligned?: boolean; width?: number }): void {
    const w = opts?.width ?? 220
    const x = opts?.rightAligned ? (A4.width - MARGIN.right - w) : MARGIN.left
    this.ensureSpace(40)
    this.cursorY -= 24
    this.page.drawLine({
      start: { x, y: this.cursorY }, end: { x: x + w, y: this.cursorY },
      thickness: 0.7, color: COLORS.dark,
    })
    this.page.drawText(label, {
      x, y: this.cursorY - 12, font: this.regular, size: 9, color: COLORS.gray,
    })
    this.cursorY -= 22
  }

  /** Due firme affiancate (sx/dx). */
  doubleSignature(leftLabel: string, rightLabel: string): void {
    this.ensureSpace(50)
    this.cursorY -= 24
    const colW = (A4.width - MARGIN.left - MARGIN.right - 30) / 2
    const leftX = MARGIN.left
    const rightX = MARGIN.left + colW + 30
    this.page.drawLine({ start: { x: leftX, y: this.cursorY }, end: { x: leftX + colW, y: this.cursorY }, thickness: 0.7, color: COLORS.dark })
    this.page.drawLine({ start: { x: rightX, y: this.cursorY }, end: { x: rightX + colW, y: this.cursorY }, thickness: 0.7, color: COLORS.dark })
    this.page.drawText(leftLabel, { x: leftX, y: this.cursorY - 12, font: this.regular, size: 9, color: COLORS.gray })
    this.page.drawText(rightLabel, { x: rightX, y: this.cursorY - 12, font: this.regular, size: 9, color: COLORS.gray })
    this.cursorY -= 22
  }

  spacer(h = 8): void {
    this.cursorY -= h
  }

  /** Data e luogo firma (riga compatta). */
  placeAndDate(luogo: string | undefined, data: string | undefined): void {
    const text = `${luogo || '_______________________'} , lì ${data || '_______________________'}`
    this.ensureSpace(20)
    this.page.drawText(text, { x: MARGIN.left, y: this.cursorY, font: this.regular, size: 10, color: COLORS.dark })
    this.cursorY -= 18
  }

  async save(): Promise<Uint8Array> {
    return this.doc.save()
  }
}

/** Helper: scarica il PDF come download del browser. */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
