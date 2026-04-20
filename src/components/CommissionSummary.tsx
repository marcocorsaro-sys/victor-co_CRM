import { calculateCommissions, formatEur } from '../lib/calculations'
import type { CommissionOptions } from '../lib/calculations'

type Props = {
  finalValue: number
  commPctSeller: number
  commPctBuyer: number
  origin: 'agente' | 'agenzia' | 'valutazione'
  agentCommPctAgency: number
  agentCommPctAgent: number
  opts?: CommissionOptions
  collaboratorLabel?: string
}

export default function CommissionSummary({
  finalValue,
  commPctSeller,
  commPctBuyer,
  origin,
  agentCommPctAgency,
  agentCommPctAgent,
  opts,
  collaboratorLabel,
}: Props) {
  const result = calculateCommissions(
    finalValue,
    commPctSeller,
    commPctBuyer,
    origin,
    agentCommPctAgency,
    agentCommPctAgent,
    opts
  )

  const agentPct = origin === 'agente' ? agentCommPctAgent : agentCommPctAgency
  const modeSeller = opts?.commModeSeller || 'pct'
  const modeBuyer = opts?.commModeBuyer || 'pct'
  const collabPct = opts?.collaboratorCommPct || 0

  return (
    <div className="commission-summary">
      <div className="row">
        <span className="label">
          Comm. venditore {modeSeller === 'pct' ? `(${commPctSeller}%)` : '(fisso)'}
        </span>
        <span className="value">{formatEur(result.breakdown.seller)}</span>
      </div>
      <div className="row">
        <span className="label">
          Comm. acquirente {modeBuyer === 'pct' ? `(${commPctBuyer}%)` : '(fisso)'}
        </span>
        <span className="value">{formatEur(result.breakdown.buyer)}</span>
      </div>
      <div className="row total">
        <span className="label">Commissione totale agenzia</span>
        <span className="value">{formatEur(result.grossCommission)}</span>
      </div>
      <div className="row agent-row">
        <span className="label">
          Quota agente ({agentPct}%)
          <span className={`badge badge-${origin}`} style={{ marginLeft: 6 }}>
            {origin}
          </span>
        </span>
        <span className="value">{formatEur(result.agentCommission)}</span>
      </div>
      {collabPct > 0 && (
        <div className="row" style={{ color: 'var(--teal)' }}>
          <span className="label">
            Quota collaboratore ({collabPct}%)
            {collaboratorLabel && (
              <span style={{ fontSize: 10, color: 'var(--g)', marginLeft: 6 }}>{collaboratorLabel}</span>
            )}
          </span>
          <span className="value">{formatEur(result.collaboratorCommission)}</span>
        </div>
      )}
      <div className="row agency-row">
        <span className="label">Quota agenzia</span>
        <span className="value">{formatEur(result.agencyRevenue)}</span>
      </div>
    </div>
  )
}
