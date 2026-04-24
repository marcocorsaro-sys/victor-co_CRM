import { useState } from 'react'
import type { Profile, Operation } from '../lib/supabase'
import { useOperations } from '../hooks/useOperations'
import { useAgentsDirectory } from '../hooks/useAgentsDirectory'
import { formatEur, estimatePipelineCommission, getPipelineWeight, PIPELINE_FORMULAS } from '../lib/calculations'
import KpiCard from '../components/KpiCard'
import OpCard from '../components/OpCard'
import OpModal from '../components/OpModal'
import CloseModal from '../components/CloseModal'
import ToastContainer from '../components/ToastContainer'
import FormulaTip from '../components/FormulaTip'
import { useToast } from '../hooks/useToast'

type Props = {
  profile: Profile
}

export default function AgentDashboard({ profile }: Props) {
  const { operations, loading, addOperation, updateOperation, deleteOperation } = useOperations(profile.id)
  const { agents } = useAgentsDirectory()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i)

  const [tab, setTab] = useState<'pipeline' | 'completata'>('pipeline')
  const [showOpModal, setShowOpModal] = useState(false)
  const [editingOp, setEditingOp] = useState<Operation | null>(null)
  const [closingOp, setClosingOp] = useState<Operation | null>(null)
  const { toasts, addToast } = useToast()

  const pipeline = operations.filter(o => o.status === 'pipeline')
  const completed = operations.filter(o => o.status === 'completata')
  const yearStart = new Date(selectedYear, 0, 1)
  const yearEnd = new Date(selectedYear + 1, 0, 1)
  const completedYear = completed.filter(o =>
    o.sale_date && new Date(o.sale_date) >= yearStart && new Date(o.sale_date) < yearEnd
  )
  const totalCommissions = completedYear.reduce((s, o) => s + (o.agent_commission || 0), 0)
  const pipelineValue = pipeline.reduce((s, o) => s + (o.property_value || 0), 0)

  // Expected agent commissions from pipeline (includes fixed-mode + collaborator)
  const pipelineExpectedAgent = pipeline.reduce((s, op) => {
    const r = estimatePipelineCommission(op, profile)
    return s + (r?.agentCommission || 0)
  }, 0)

  // Weighted by sale_probability (null → 50% fallback, consistent with app)
  const pipelineWeightedAgent = pipeline.reduce((s, op) => {
    const r = estimatePipelineCommission(op, profile)
    return s + (r ? r.agentCommission * getPipelineWeight(op) : 0)
  }, 0)

  const estimatedTotalYear = totalCommissions + pipelineExpectedAgent
  const estimatedWeightedYear = totalCommissions + pipelineWeightedAgent

  const getExpectedCommission = (op: Operation) => {
    const r = estimatePipelineCommission(op, profile)
    return r?.agentCommission
  }

  const handleAddOp = async (data: Partial<Operation>) => {
    const { error } = await addOperation(data)
    if (error) {
      addToast('Errore nel salvataggio', 'error')
    } else {
      addToast('Operazione aggiunta', 'success')
      setShowOpModal(false)
    }
  }

  const handleEditOp = async (data: Partial<Operation>) => {
    if (!editingOp) return
    const { error } = await updateOperation(editingOp.id, data)
    if (error) {
      addToast('Errore nella modifica', 'error')
    } else {
      addToast('Operazione modificata', 'success')
      setEditingOp(null)
      setShowOpModal(false)
    }
  }

  const handleCloseOp = async (data: Partial<Operation>) => {
    if (!closingOp) return
    const { error } = await updateOperation(closingOp.id, data)
    if (error) {
      addToast('Errore nella chiusura', 'error')
    } else {
      addToast('Operazione chiusa con successo', 'success')
      setClosingOp(null)
    }
  }

  const handleDeleteOp = async (id: string) => {
    if (!confirm('Eliminare questa operazione?')) return
    const { error } = await deleteOperation(id)
    if (error) {
      addToast('Errore nell\'eliminazione', 'error')
    } else {
      addToast('Operazione eliminata', 'success')
    }
  }

  const current = tab === 'pipeline' ? pipeline : completed

  return (
    <div>
      <ToastContainer toasts={toasts} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-heading" style={{ margin: 0 }}>Le mie operazioni</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="filter-select" value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: 100 }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setEditingOp(null); setShowOpModal(true) }}>
            + Nuova Operazione
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard value={pipeline.length.toString()} label="In Pipeline" loading={loading} />
        <KpiCard value={completedYear.length.toString()} label={`Chiuse ${selectedYear}`} loading={loading} color="green" />
        <KpiCard value={formatEur(totalCommissions)} label="Provvigioni maturate" loading={loading} color="teal"
          legend={<FormulaTip title="Provvigioni maturate" formula={`Somma delle quote agente delle operazioni chiuse nel ${selectedYear}`} />} />
        <KpiCard value={formatEur(pipelineValue)} label="Valore pipeline" loading={loading} color="amber"
          legend={<FormulaTip title="Valore pipeline" formula="Somma del property_value di tutte le operazioni in pipeline" />} />
        <KpiCard value={formatEur(pipelineExpectedAgent)} label="Comm. stimate pipeline" loading={loading} color="amber"
          legend={<FormulaTip title="Comm. stimate pipeline (quota agente)"
            formula="Σ quota_agente(op) per ogni operazione in pipeline, senza pesi"
            note="Include modalità fissa/% e quote collaboratori." />} />
        <KpiCard value={formatEur(pipelineWeightedAgent)} label="Comm. pesate prob." loading={loading} color="teal"
          legend={<FormulaTip title="Comm. pipeline pesate (quota agente)"
            formula={PIPELINE_FORMULAS.pipelineWeighted.replace('Comm. lorda', 'Quota agente')}
            note={PIPELINE_FORMULAS.weight} />} />
        <KpiCard value={formatEur(estimatedTotalYear)} label={`Stima Tot. ${selectedYear}`} loading={loading} color="green"
          legend={<FormulaTip title={`Stima Tot. ${selectedYear} (quota agente)`}
            formula={`Provvigioni maturate ${selectedYear} + Comm. stimate pipeline (quota agente)`}
            note="Scenario ottimistico: tutta la pipeline chiude." />} />
        <KpiCard value={formatEur(estimatedWeightedYear)} label={`Stima Pesata ${selectedYear}`} loading={loading} color="teal"
          legend={<FormulaTip title={`Stima Pesata ${selectedYear} (quota agente)`}
            formula={`Provvigioni maturate ${selectedYear} + Comm. pipeline pesate`}
            note="Scenario realistico ponderato per probabilità di vendita." />} />
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'pipeline' ? 'active' : ''}`} onClick={() => setTab('pipeline')}>
          Pipeline ({pipeline.length})
        </button>
        <button className={`tab ${tab === 'completata' ? 'active' : ''}`} onClick={() => setTab('completata')}>
          Completate ({completed.length})
        </button>
      </div>

      {loading ? (
        <div className="op-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 10 }} />)}
        </div>
      ) : current.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>Nessuna operazione {tab === 'pipeline' ? 'in pipeline' : 'completata'}</p>
        </div>
      ) : (
        <div className="op-grid">
          {current.map(op => (
            <OpCard
              key={op.id}
              op={op}
              expectedCommission={op.status === 'pipeline' ? getExpectedCommission(op) : undefined}
              onClose={tab === 'pipeline' ? () => setClosingOp(op) : undefined}
              onEdit={() => { setEditingOp(op); setShowOpModal(true) }}
              onDelete={() => handleDeleteOp(op.id)}
            />
          ))}
        </div>
      )}

      <OpModal
        open={showOpModal}
        onClose={() => { setShowOpModal(false); setEditingOp(null) }}
        onSave={editingOp ? handleEditOp : handleAddOp}
        initial={editingOp}
        agentId={profile.id}
        agentProfile={profile}
        agents={agents}
      />

      <CloseModal
        open={!!closingOp}
        onClose={() => setClosingOp(null)}
        onConfirm={handleCloseOp}
        operation={closingOp}
        agentProfile={profile}
      />
    </div>
  )
}
