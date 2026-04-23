export interface CommissionResult {
  grossCommission: number
  agentCommission: number
  agencyRevenue: number
  collaboratorCommission: number
  breakdown: {
    seller: number
    buyer: number
  }
}

export interface CommissionOptions {
  commModeSeller?: 'pct' | 'fixed'
  commModeBuyer?: 'pct' | 'fixed'
  commFixedSeller?: number
  commFixedBuyer?: number
  collaboratorCommPct?: number
}

/**
 * Fallback weight when sale_probability is null.
 * 50% = neutral stance (neither assumes certain nor impossible close).
 */
export const PIPELINE_WEIGHT_FALLBACK = 0.5

/**
 * Human-readable formula text for tooltips/legends.
 * Keep in sync with getPipelineWeight + estimatePipelineCommission.
 */
export const PIPELINE_FORMULAS = {
  weight: 'peso = sale_probability / 100 (30% / 60% / 90%); 50% se non specificata',
  pipelineGross: 'Comm. lorda pipeline = somma commissioni lorde di tutte le operazioni in pipeline (non pesata)',
  pipelineWeighted: 'Comm. pipeline pesata = Σ (comm. lorda operazione × peso probabilità)',
  estimatedTotal: 'Stima Tot. anno = Comm. chiuse nell\'anno + Comm. lorda pipeline (scenario ottimistico)',
  estimatedWeighted: 'Stima Pesata anno = Comm. chiuse nell\'anno + Comm. pipeline pesata (scenario realistico)',
  agentShare: 'Quota agente = Comm. lorda × (% agenzia se origine agenzia/valutazione, % agente se origine agente)',
  agencyMargin: 'Margine agenzia = Comm. lorda - Quota agente - Quota collaboratore',
}

/** Returns weight for an operation based on its sale_probability (0..1). */
export function getPipelineWeight(op: { sale_probability: number | null }): number {
  return op.sale_probability != null ? op.sale_probability / 100 : PIPELINE_WEIGHT_FALLBACK
}

/**
 * Minimal shape needed to compute pipeline commissions for an operation.
 * Accepts both Operation and OperationWithAgent.
 */
export type PipelineOpLike = {
  property_value: number | null
  comm_pct_seller: number
  comm_pct_buyer: number
  origin: 'agente' | 'agenzia' | 'valutazione'
  comm_mode_seller?: 'pct' | 'fixed' | null
  comm_mode_buyer?: 'pct' | 'fixed' | null
  comm_fixed_seller?: number | null
  comm_fixed_buyer?: number | null
  collaborator_comm_pct?: number | null
  sale_probability: number | null
}

export type AgentRateLike = {
  comm_pct_agency: number
  comm_pct_agent: number
}

/**
 * Central estimator for pipeline commissions.
 * Always passes `opts` so fixed-mode commissions + collaborator share are correct.
 * Returns null if value or agent is missing.
 */
export function estimatePipelineCommission(op: PipelineOpLike, agent: AgentRateLike | null | undefined): CommissionResult | null {
  if (!agent || !op.property_value) return null
  return calculateCommissions(
    op.property_value,
    op.comm_pct_seller,
    op.comm_pct_buyer,
    op.origin,
    agent.comm_pct_agency,
    agent.comm_pct_agent,
    {
      commModeSeller: op.comm_mode_seller || 'pct',
      commModeBuyer: op.comm_mode_buyer || 'pct',
      commFixedSeller: op.comm_fixed_seller || 0,
      commFixedBuyer: op.comm_fixed_buyer || 0,
      collaboratorCommPct: op.collaborator_comm_pct || 0,
    }
  )
}

export function calculateCommissions(
  finalValue: number,
  commPctSeller: number,
  commPctBuyer: number,
  origin: 'agente' | 'agenzia' | 'valutazione',
  agentCommPctAgency: number,
  agentCommPctAgent: number,
  opts?: CommissionOptions
): CommissionResult {
  const modeSeller = opts?.commModeSeller || 'pct'
  const modeBuyer = opts?.commModeBuyer || 'pct'

  const seller = modeSeller === 'fixed' ? (opts?.commFixedSeller || 0) : finalValue * (commPctSeller / 100)
  const buyer = modeBuyer === 'fixed' ? (opts?.commFixedBuyer || 0) : finalValue * (commPctBuyer / 100)
  const grossCommission = seller + buyer
  const agentPct = origin === 'agente' ? agentCommPctAgent : agentCommPctAgency
  const agentCommission = grossCommission * (agentPct / 100)
  const collabPct = opts?.collaboratorCommPct || 0
  const collaboratorCommission = collabPct > 0 ? grossCommission * (collabPct / 100) : 0
  const agencyRevenue = grossCommission - agentCommission - collaboratorCommission

  return {
    grossCommission: Number(grossCommission.toFixed(2)),
    agentCommission: Number(agentCommission.toFixed(2)),
    collaboratorCommission: Number(collaboratorCommission.toFixed(2)),
    agencyRevenue: Number(agencyRevenue.toFixed(2)),
    breakdown: {
      seller: Number(seller.toFixed(2)),
      buyer: Number(buyer.toFixed(2)),
    },
  }
}

const eurFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

export function formatEur(value: number): string {
  return eurFormatter.format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('it-IT').format(value)
}

/** "16/03/2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT')
}

/** "16/03/2026 14:32" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

/** "14:32" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

/** Format number for EUR input display: 250000 → "250.000,00" */
export function toEurInput(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return ''
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Parse Italian-formatted EUR string back to number: "250.000,00" → 250000 */
export function parseEurInput(s: string): number {
  const cleaned = s.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}
