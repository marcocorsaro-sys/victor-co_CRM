import type { OperationWithAgent, Profile } from '../lib/supabase'
import { formatEur, calculateCommissions } from '../lib/calculations'

type Props = {
  operations: OperationWithAgent[]
  agents: Profile[]
}

export default function ForecastCard({ operations, agents }: Props) {
  const pipeline = operations.filter(o => o.status === 'pipeline')

  const totalPipelineValue = pipeline.reduce((s, o) => s + (o.property_value || 0), 0)

  // Precise per-operation expected commissions
  const pipelineEstimates = pipeline.map(op => {
    const agent = agents.find(a => a.id === op.agent_id)
    if (!agent || !op.property_value) return { gross: 0, agent: 0, agency: 0 }
    const result = calculateCommissions(
      op.property_value,
      op.comm_pct_seller,
      op.comm_pct_buyer,
      op.origin,
      agent.comm_pct_agency,
      agent.comm_pct_agent
    )
    return {
      gross: result.grossCommission,
      agent: result.agentCommission,
      agency: result.agencyRevenue,
    }
  })

  const totalExpectedGross = pipelineEstimates.reduce((s, e) => s + e.gross, 0)
  const totalExpectedAgent = pipelineEstimates.reduce((s, e) => s + e.agent, 0)
  const totalExpectedAgency = pipelineEstimates.reduce((s, e) => s + e.agency, 0)

  // Per agent breakdown
  const agentData = agents.filter(a => a.active).map(agent => {
    const agentPipeline = pipeline.filter(o => o.agent_id === agent.id)
    const agentValue = agentPipeline.reduce((s, o) => s + (o.property_value || 0), 0)
    const agentGross = agentPipeline.reduce((s, op) => {
      if (!op.property_value) return s
      const r = calculateCommissions(
        op.property_value, op.comm_pct_seller, op.comm_pct_buyer,
        op.origin, agent.comm_pct_agency, agent.comm_pct_agent
      )
      return s + r.grossCommission
    }, 0)
    return {
      agent,
      pipelineCount: agentPipeline.length,
      pipelineValue: agentValue,
      estimatedGross: agentGross,
    }
  }).filter(d => d.pipelineCount > 0)

  const maxValue = Math.max(...agentData.map(d => d.pipelineValue), 1)

  return (
    <div className="forecast-card">
      <span className="forecast-label">FORECAST</span>
      <div className="section-heading">Pipeline Corrente</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div className="kpi-label">Valore pipeline</div>
          <div className="kpi-value" style={{ fontSize: '1.2em' }}>{formatEur(totalPipelineValue)}</div>
        </div>
        <div>
          <div className="kpi-label">Comm. lorde stimate</div>
          <div className="kpi-value amber" style={{ fontSize: '1.2em' }}>{formatEur(totalExpectedGross)}</div>
        </div>
        <div>
          <div className="kpi-label">Margine agenzia stimato</div>
          <div className="kpi-value" style={{ fontSize: '1.2em', color: 'var(--green)' }}>{formatEur(totalExpectedAgency)}</div>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 8, marginBottom: 20,
        padding: '10px 14px', background: 'var(--s3)', borderRadius: 8,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
      }}>
        <div>Comm. agenti stimate</div>
        <div style={{ textAlign: 'right', color: 'var(--teal)' }}>{formatEur(totalExpectedAgent)}</div>
      </div>

      {agentData.length > 0 && (
        <div>
          {agentData.map(d => (
            <div key={d.agent.id} className="forecast-row">
              <div className="forecast-agent-name">
                <div className="avatar" style={{ backgroundColor: d.agent.color, width: 24, height: 24, fontSize: 9 }}>
                  {d.agent.initials}
                </div>
                <span>{d.agent.full_name}</span>
                <span style={{ color: 'var(--g)', fontSize: 11, marginLeft: 4 }}>({d.pipelineCount})</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${(d.pipelineValue / maxValue) * 100}%`,
                    backgroundColor: d.agent.color,
                  }}
                />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--gl)', minWidth: 90, textAlign: 'right' }}>
                {formatEur(d.estimatedGross)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--g)', marginTop: 16 }}>
        * Stime calcolate sui valori e le percentuali di commissione di ogni operazione.
      </p>
    </div>
  )
}
