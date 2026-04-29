import type { AgencySettings, Client, OperationWithAgent, Profile } from '../supabase'
import type { DocumentTemplate, FieldDef, FieldSource } from './types'

/** Naviga un oggetto via dot-path: 'dati_catastali.foglio' */
function getByPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

export interface ResolverContext {
  operation: OperationWithAgent
  agent: Profile | null | undefined
  agency: AgencySettings | null
  /** Cliente collegato all'operazione (venditore o acquirente). */
  client: Client | null
  /** Override manuale dell'utente (salvato in `operation_documents.data`). */
  manualOverrides?: Record<string, unknown>
}

function resolveField(field: FieldDef, ctx: ResolverContext): unknown {
  // Manual override sempre vince
  if (ctx.manualOverrides && Object.prototype.hasOwnProperty.call(ctx.manualOverrides, field.key)) {
    const v = ctx.manualOverrides[field.key]
    if (v !== undefined && v !== null && v !== '') return v
  }
  const src = field.source
  switch (src.kind) {
    case 'client':
      return ctx.client ? getByPath(ctx.client, src.path) : undefined
    case 'operation':
      return getByPath(ctx.operation, src.path)
    case 'agent':
      return ctx.agent ? getByPath(ctx.agent, src.path) : undefined
    case 'agency':
      return ctx.agency ? getByPath(ctx.agency, src.path) : undefined
    case 'computed':
      if (src.compute === 'today') {
        return new Date().toISOString().split('T')[0]
      }
      if (src.compute === 'agent_full_name') {
        return ctx.agent?.full_name
      }
      return undefined
    case 'manual':
      return ctx.manualOverrides?.[field.key]
  }
}

/** Per ogni campo del template, calcola il valore effettivo (auto-resolved + override). */
export function resolveTemplateData(
  template: DocumentTemplate,
  ctx: ResolverContext
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of template.fields) {
    const v = resolveField(field, ctx)
    if (v !== undefined && v !== null) out[field.key] = v
  }
  return out
}

/** Indica se un campo ha valore (per highlight UI dei campi mancanti). */
export function hasFieldValue(field: FieldDef, ctx: ResolverContext): boolean {
  const v = resolveField(field, ctx)
  if (v === undefined || v === null) return false
  if (typeof v === 'string' && v.trim() === '') return false
  return true
}

/** Conta quanti campi obbligatori sono mancanti. */
export function countMissingRequired(template: DocumentTemplate, ctx: ResolverContext): number {
  return template.fields.filter(f => f.required && !hasFieldValue(f, ctx)).length
}

/** Mostra il source come label umana. */
export function describeFieldSource(source: FieldSource): string {
  switch (source.kind) {
    case 'client': return `da scheda cliente: ${source.path}`
    case 'operation': return `da operazione: ${source.path}`
    case 'agent': return `da agente: ${source.path}`
    case 'agency': return `da agenzia: ${source.path}`
    case 'computed': return source.compute === 'today' ? 'data odierna automatica' : 'nome agente automatico'
    case 'manual': return 'da inserire a mano'
  }
}

/** Helpers per formattazione runtime. */
export function formatFieldValue(field: FieldDef, value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  switch (field.type) {
    case 'date':
      if (typeof value === 'string') {
        try { return new Date(value).toLocaleDateString('it-IT') } catch { return value }
      }
      return String(value)
    case 'eur':
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value)
      if (isNaN(n)) return String(value)
      return field.type === 'eur'
        ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
        : new Intl.NumberFormat('it-IT').format(n)
    }
    case 'percent': {
      const n = typeof value === 'number' ? value : Number(value)
      if (isNaN(n)) return String(value)
      return `${n}%`
    }
    case 'checkbox':
      return value ? 'Sì' : 'No'
    case 'select': {
      const opt = field.options?.find(o => o.value === value)
      return opt ? opt.label : String(value)
    }
    default:
      return String(value)
  }
}
