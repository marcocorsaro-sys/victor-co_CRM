import type { DocumentParty, DocumentTemplateId } from '../supabase'

export type FieldType =
  | 'text'
  | 'date'
  | 'number'
  | 'eur'
  | 'percent'
  | 'checkbox'
  | 'select'
  | 'textarea'

export type FieldSource =
  /** Letto dal client collegato all'incarico (per buyer/seller). */
  | { kind: 'client'; path: string }
  /** Letto dall'operation. */
  | { kind: 'operation'; path: string }
  /** Letto dall'agente assegnato all'operation. */
  | { kind: 'agent'; path: string }
  /** Letto dalla configurazione agenzia. */
  | { kind: 'agency'; path: string }
  /** Sempre da inserire a mano (no auto-fill). */
  | { kind: 'manual' }
  /** Valore costante (es. data odierna). */
  | { kind: 'computed'; compute: 'today' | 'agent_full_name' }

export interface FieldDef {
  /** Chiave del campo (usata sia in DB JSONB sia in PDF AcroForm). */
  key: string
  /** Etichetta UI. */
  label: string
  /** Tipo input. */
  type: FieldType
  /** Da dove prendere il valore di default. */
  source: FieldSource
  /** Obbligatorio per generare il PDF. */
  required?: boolean
  /** Opzioni per `select`. */
  options?: { value: string; label: string }[]
  /** Sezione di raggruppamento UI. */
  section?: string
  /** Note/help. */
  hint?: string
}

export interface DocumentTemplate {
  id: DocumentTemplateId
  /** Per chi: 'buyer' | 'seller' | 'agency'. Determina chi è il "soggetto" compilante. */
  party: DocumentParty
  /** Titolo umano del documento. */
  title: string
  /** Descrizione breve. */
  description: string
  /** Path al PDF template in /public/documents/. */
  pdfPath: string
  /** Quando deve essere prodotto (vendita, locazione, sempre). */
  applicableTo: ('vendita' | 'locazione' | 'sempre')[]
  /** Lista campi compilabili. */
  fields: FieldDef[]
}
