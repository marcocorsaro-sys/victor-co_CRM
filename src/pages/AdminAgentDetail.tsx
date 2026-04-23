import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOperations } from '../hooks/useOperations'
import { useProfiles } from '../hooks/useProfiles'
import { useBudgets } from '../hooks/useBudgets'
import { formatEur, formatDate, estimatePipelineCommission, getPipelineWeight, PIPELINE_FORMULAS } from '../lib/calculations'
import KpiCard from '../components/KpiCard'
import OperationDetailModal from '../components/OperationDetailModal'
import FormulaTip from '../components/FormulaTip'
import type { OperationWithAgent } from '../lib/supabase'

export default function AdminAgentDetail() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const { operations, loading: opsLoading } = useOperations()
  const { agents, loading: profilesLoading } = useProfiles()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { allocations } = useBudgets(selectedYear)
  const [detailOp, setDetailOp] = useState<OperationWithAgent | null>(null)
  const [fStatus, setFStatus] = useState('')

  const loading = opsLoading || profilesLoading
  const agent = agents.find(a => a.id === agentId)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i)

  const agentOps = useMemo(() =>
    operations.filter(o => o.agent_id === agentId),
    [operations, agentId]
  )

  const yearStart = new Date(selectedYear, 0, 1)
  const yearEnd = new Date(selectedYear + 1, 0, 1)

  const completedYear = useMemo(() =>
    agentOps.filter(o =>
      o.status === 'completata' && o.sale_date &&
      new Date(o.sale_date) >= yearStart && new Date(o.sale_date) < yearEnd
    ),
    [agentOps, selectedYear]
  )

  const pipelineOps = useMemo(() =>
    agentOps.filter(o => o.status === 'pipeline'),
    [agentOps]
  )

  // Completed KPIs
  const totalGross = completedYear.reduce((s, o) => s + (o.gross_commission || 0), 0)
  const totalAgent = completedYear.reduce((s, o) => s + (o.agent_commission || 0), 0)
  const totalCollected = completedYear.reduce((s, o) => s + (o.commission_collected || 0), 0)
  const agencyMargin = totalGross - totalAgent
  const totalValue = completedYear.reduce((s, o) => s + (o.final_value || o.property_value || 0), 0)

  // Pipeline estimated KPIs (central helper: handles fixed-mode + collaborator share)
  const getEstimated = (op: OperationWithAgent) => estimatePipelineCommission(op, agent)

  const pipelineValue = pipelineOps.reduce((s, o) => s + (o.property_value || 0), 0)
  const pipelineEstGross = pipelineOps.reduce((s, o) => s + (getEstimated(o)?.grossCommission || 0), 0)
  const pipelineEstAgent = pipelineOps.reduce((s, o) => s + (getEstimated(o)?.agentCommission || 0), 0)
  const pipelineEstAgency = pipelineOps.reduce((s, o) => s + (getEstimated(o)?.agencyRevenue || 0), 0)
  // Weighted: null probability → 50% fallback (consistent with app)
  const pipelineWeightedGross = pipelineOps.reduce((s, o) => {
    const est = getEstimated(o)
    return s + (est ? est.grossCommission * getPipelineWeight(o) : 0)
  }, 0)
  const pipelineWeightedAgent = pipelineOps.reduce((s, o) => {
    const est = getEstimated(o)
    return s + (est ? est.agentCommission * getPipelineWeight(o) : 0)
  }, 0)
  const pipelineWeightedAgency = pipelineOps.reduce((s, o) => {
    const est = getEstimated(o)
    return s + (est ? est.agencyRevenue * getPipelineWeight(o) : 0)
  }, 0)

  // Closing rate (year-based: closed in year / (closed + pipeline))
  const closingRate = (completedYear.length + pipelineOps.length) > 0
    ? (completedYear.length / (completedYear.length + pipelineOps.length) * 100) : 0

  // Budget
  const agentAllocation = allocations.find(a => a.agent_id === agentId)
  const budgetTarget = agentAllocation?.allocated_target || 0
  const budgetPct = budgetTarget > 0 ? (totalGross / budgetTarget * 100) : 0

  // Monthly breakdown for selected year
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      label: new Date(selectedYear, i).toLocaleDateString('it-IT', { month: 'short' }),
      closed: 0,
      grossComm: 0,
      agentComm: 0,
      value: 0,
    }))
    completedYear.forEach(op => {
      const m = new Date(op.sale_date!).getMonth()
      months[m].closed++
      months[m].grossComm += op.gross_commission || 0
      months[m].agentComm += op.agent_commission || 0
      months[m].value += op.final_value || op.property_value || 0
    })
    return months
  }, [completedYear, selectedYear])

  // Filter operations for display
  const displayOps = fStatus ? agentOps.filter(o => o.status === fStatus) : agentOps

  if (!loading && !agent) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--g)' }}>Agente non trovato</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Torna indietro</button>
      </div>
    )
  }

  const mono = { fontFamily: "'JetBrains Mono', monospace" }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Indietro</button>
          {agent && (
            <>
              <div className="avatar" style={{ backgroundColor: agent.color, width: 48, height: 48, fontSize: 16 }}>
                {agent.initials}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--w)' }}>{agent.full_name}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span className={`badge badge-${agent.role === 'admin' ? 'agenzia' : 'agente'}`}>{agent.role}</span>
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} style={{ fontSize: 12, color: 'var(--teal)', textDecoration: 'none' }}>{agent.phone}</a>
                  )}
                  {agent.display_email && (
                    <a href={`mailto:${agent.display_email}`} style={{ fontSize: 12, color: 'var(--teal)', textDecoration: 'none' }}>{agent.display_email}</a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <select className="filter-select" value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: 100 }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KpiCard value={completedYear.length.toString()} label={`Chiuse ${selectedYear}`} loading={loading}
          onClick={() => setFStatus(fStatus === 'completata' ? '' : 'completata')} />
        <KpiCard value={pipelineOps.length.toString()} label="Pipeline" loading={loading} color="amber"
          onClick={() => setFStatus(fStatus === 'pipeline' ? '' : 'pipeline')} />
        <KpiCard value={formatEur(totalGross)} label="Comm. Lorde" loading={loading} />
        <KpiCard value={formatEur(totalAgent)} label="Provvigioni Agente" loading={loading} color="teal" />
        <KpiCard value={formatEur(agencyMargin)} label="Margine Agenzia" loading={loading} color="green" />
        <KpiCard value={`${closingRate.toFixed(0)}%`} label="% Chiusura" loading={loading} />
      </div>

      {/* Budget + Pipeline side by side */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Budget */}
          <div style={{ background: 'var(--s1)', borderRadius: 12, padding: 16, border: '1px solid var(--bd)' }}>
            <div style={{ ...mono, fontSize: 11, color: 'var(--ld)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
              // Budget {selectedYear}
            </div>
            {budgetTarget > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--g)' }}>Obiettivo</span>
                  <span style={{ ...mono, color: 'var(--w)' }}>{formatEur(budgetTarget)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--g)' }}>Raggiunto</span>
                  <span style={{ ...mono, color: budgetPct >= 100 ? 'var(--green)' : 'var(--lime)' }}>{formatEur(totalGross)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--g)' }}>Avanzamento</span>
                  <span style={{ ...mono, fontWeight: 600, color: budgetPct >= 100 ? 'var(--green)' : 'var(--w)' }}>{budgetPct.toFixed(0)}%</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className="progress-bar-fill" style={{
                    width: `${Math.min(budgetPct, 100)}%`,
                    backgroundColor: budgetPct >= 100 ? 'var(--green)' : agent?.color || 'var(--lime)',
                  }} />
                </div>
                {budgetTarget - totalGross > 0 && (
                  <div style={{ ...mono, fontSize: 11, color: 'var(--g)', marginTop: 6 }}>
                    Mancano {formatEur(budgetTarget - totalGross)}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--g)', fontSize: 13 }}>Nessun budget allocato per {selectedYear}</p>
            )}
          </div>

          {/* Pipeline Stimate */}
          <div style={{ background: 'var(--s1)', borderRadius: 12, padding: 16, border: '1px solid var(--bd)' }}>
            <div style={{ ...mono, fontSize: 11, color: 'var(--ld)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
              <span>// Pipeline Stime</span>
              <FormulaTip title="Pipeline Stime"
                formula={<>
                  <div><b>Comm. lorde stimate</b>: {PIPELINE_FORMULAS.pipelineGross}</div>
                  <div style={{ marginTop: 4 }}><b>Quota agente</b>: {PIPELINE_FORMULAS.agentShare}</div>
                  <div style={{ marginTop: 4 }}><b>Margine agenzia</b>: {PIPELINE_FORMULAS.agencyMargin}</div>
                </>}
                note="Include modalità fissa/% e quote collaboratori." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <div style={{ color: 'var(--g)', marginBottom: 2 }}>Valore immobili</div>
                <div style={{ ...mono, color: 'var(--w)', fontWeight: 600 }}>{formatEur(pipelineValue)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--g)', marginBottom: 2 }}>Comm. lorde stimate</div>
                <div style={{ ...mono, color: 'var(--amber)', fontWeight: 600 }}>{formatEur(pipelineEstGross)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--g)', marginBottom: 2 }}>Quota agente stimata</div>
                <div style={{ ...mono, color: 'var(--teal)', fontWeight: 600 }}>{formatEur(pipelineEstAgent)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--g)', marginBottom: 2 }}>Margine agenzia stimato</div>
                <div style={{ ...mono, color: 'var(--green)', fontWeight: 600 }}>{formatEur(pipelineEstAgency)}</div>
              </div>
            </div>
            {pipelineWeightedGross !== pipelineEstGross && (
              <div style={{ borderTop: '1px solid var(--bd)', marginTop: 10, paddingTop: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--g)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.3px', display: 'inline-flex', alignItems: 'center' }}>
                  <span>Pesato per probabilità</span>
                  <FormulaTip title="Pipeline pesata per probabilità"
                    formula={PIPELINE_FORMULAS.pipelineWeighted}
                    note={PIPELINE_FORMULAS.weight} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div>
                    <div style={{ color: 'var(--g)', marginBottom: 2 }}>Comm. lorde</div>
                    <div style={{ ...mono, color: 'var(--amber)', fontWeight: 600 }}>{formatEur(pipelineWeightedGross)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--g)', marginBottom: 2 }}>Quota agente</div>
                    <div style={{ ...mono, color: 'var(--teal)', fontWeight: 600 }}>{formatEur(pipelineWeightedAgent)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--g)', marginBottom: 2 }}>Margine agenzia</div>
                    <div style={{ ...mono, color: 'var(--green)', fontWeight: 600 }}>{formatEur(pipelineWeightedAgency)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commission rates */}
      {!loading && agent && (
        <div style={{ background: 'var(--s1)', borderRadius: 12, padding: 16, border: '1px solid var(--bd)', marginBottom: 20 }}>
          <div style={{ ...mono, fontSize: 11, color: 'var(--ld)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            // Aliquote & Info Contratto
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ color: 'var(--g)' }}>% su ops agenzia</span>
              <span style={{ ...mono, color: 'var(--w)' }}>{agent.comm_pct_agency}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ color: 'var(--g)' }}>% su ops agente</span>
              <span style={{ ...mono, color: 'var(--w)' }}>{agent.comm_pct_agent}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ color: 'var(--g)' }}>Tipo contratto</span>
              <span style={{ color: 'var(--w)' }}>{agent.contract_type || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ color: 'var(--g)' }}>Data inizio</span>
              <span style={{ color: 'var(--w)' }}>{agent.contract_start_date ? formatDate(agent.contract_start_date) : '—'}</span>
            </div>
            {totalCollected > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
                <span style={{ color: 'var(--g)' }}>Provvigioni incassate</span>
                <span style={{ ...mono, color: 'var(--green)' }}>{formatEur(totalCollected)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly breakdown */}
      {!loading && (
        <div style={{ background: 'var(--s1)', borderRadius: 12, padding: 16, border: '1px solid var(--bd)', marginBottom: 20 }}>
          <div style={{ ...mono, fontSize: 11, color: 'var(--ld)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            // Andamento Mensile {selectedYear}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mese</th><th>Chiuse</th><th>Valore</th><th>Comm. Lorde</th><th>Provvigioni Agente</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map(m => (
                  <tr key={m.month} style={m.closed === 0 ? { opacity: 0.4 } : {}}>
                    <td style={{ textTransform: 'capitalize' }}>{m.label}</td>
                    <td>{m.closed}</td>
                    <td style={mono}>{m.value > 0 ? formatEur(m.value) : '—'}</td>
                    <td style={mono}>{m.grossComm > 0 ? formatEur(m.grossComm) : '—'}</td>
                    <td style={{ ...mono, color: 'var(--teal)' }}>{m.agentComm > 0 ? formatEur(m.agentComm) : '—'}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Totale</td>
                  <td>{completedYear.length}</td>
                  <td style={mono}>{formatEur(totalValue)}</td>
                  <td style={mono}>{formatEur(totalGross)}</td>
                  <td style={{ ...mono, color: 'var(--teal)' }}>{formatEur(totalAgent)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operations list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="section-heading" style={{ margin: 0 }}>
          Immobili {fStatus && `(${fStatus})`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="filter-select" value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ width: 150 }}>
            <option value="">Tutti gli stati</option>
            <option value="pipeline">Pipeline</option>
            <option value="completata">Completata</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Immobile</th><th>Tipo</th><th>Origine</th><th>Stato</th><th>Prob.</th>
              <th>Valore</th><th>Comm. Lorde</th><th>Quota Agente</th><th>Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}><div className="skeleton skeleton-row" /></td></tr>
            ) : displayOps.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--g)', padding: 24 }}>Nessuna operazione</td></tr>
            ) : (
              displayOps.map(op => {
                const est = op.status === 'pipeline' ? getEstimated(op) : null
                return (
                  <tr key={op.id}>
                    <td>
                      <div className="clickable-cell" style={{ fontWeight: 600 }} onClick={() => setDetailOp(op)}>
                        {op.property_name}
                      </div>
                      {op.address && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(op.address)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: 'var(--g)', textDecoration: 'none' }}>
                          {op.address}
                        </a>
                      )}
                    </td>
                    <td><span className={`badge badge-${op.type}`}>{op.type}</span></td>
                    <td><span className={`badge badge-${op.origin}`}>{op.origin}</span></td>
                    <td><span className={`badge badge-${op.status}`}>{op.status}</span></td>
                    <td>
                      {op.status === 'pipeline' && op.sale_probability ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          color: op.sale_probability <= 30 ? 'var(--red)' : op.sale_probability <= 60 ? 'var(--amber)' : 'var(--green)',
                          background: op.sale_probability <= 30 ? 'rgba(239,68,68,0.15)' : op.sale_probability <= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                        }}>{op.sale_probability}%</span>
                      ) : op.status === 'pipeline' ? (
                        <span style={{ fontSize: 11, color: 'var(--g)' }}>—</span>
                      ) : null}
                    </td>
                    <td style={mono}>{formatEur(op.final_value || op.property_value || 0)}</td>
                    <td style={{ ...mono, color: est ? 'var(--amber)' : undefined, fontStyle: est ? 'italic' : undefined }}>
                      {op.gross_commission ? formatEur(op.gross_commission) : est ? `~${formatEur(est.grossCommission)}` : '—'}
                    </td>
                    <td style={{ ...mono, color: 'var(--teal)', fontStyle: est ? 'italic' : undefined }}>
                      {op.agent_commission ? formatEur(op.agent_commission) : est ? `~${formatEur(est.agentCommission)}` : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gl)' }}>
                      {op.sale_date ? formatDate(op.sale_date) : formatDate(op.date_added)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <OperationDetailModal
        open={!!detailOp}
        operation={detailOp}
        onClose={() => setDetailOp(null)}
        onEdit={() => setDetailOp(null)}
      />
    </div>
  )
}
