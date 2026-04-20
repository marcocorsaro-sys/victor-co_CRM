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
