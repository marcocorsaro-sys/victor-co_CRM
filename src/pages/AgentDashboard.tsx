import { useState } from 'react'
import type { Profile, Operation } from '../lib/supabase'
import { useOperations } from '../hooks/useOperations'
import { formatEur, calculateCommissions } from '../lib/calculations'
import KpiCard from '../components/KpiCard'
import OpCard from '../components/OpCard'
import OpModal from '../components/OpModal'
import CloseModal from '../components/CloseModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

type Props = {
  profile: Profile
}

export default function AgentDashboard({ profile }: Props) {
  const { operations, loading, addOperation, updateOperation, deleteOperation } = useOperations(profile.id)
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

  // Expected agent commissions from pipeline
  const pipelineExpectedAgent = pipeline.reduce((s, op) => {
    if (!op.property_value) return s
    const r = calculateCommissions(op.property_value, op.comm_pct_seller, op.comm_pct_buyer, op.origin, profile.comm_pct_agency, profile.comm_pct_agent)
    return s + r.agentCommission
  }, 0)

  // Weighted by probability
  const pipelineWeightedAgent = pipeline.reduce((s, op) => {
    if (!op.property_value) return s
    const r = calculateCommissions(op.property_value, op.comm_pct_seller, op.comm_pct_buyer, op.origin, profile.comm_pct_agency, profile.comm_pct_agent)
    return s + r.agentCommission * ((op.sale_probability || 100) / 100)
  }, 0)

  const getExpectedCommission = (op: Operation) => {
    if (!op.property_value) return undefined
    const r = calculateCommissions(op.property_value, op.comm_pct_seller, op.comm_pct_buyer, op.origin, profile.comm_pct_agency, profile.comm_pct_agent)
    return r.agentCommission
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
        <KpiCard value={formatEur(totalCommissions)} label="Provvigioni maturate" loading={loading} color="teal" />
        <KpiCard value={formatEur(pipelineValue)} label="Valore pipeline" loading={loading} color="amber" />
        <KpiCard value={formatEur(pipelineExpectedAgent)} label="Comm. stimate pipeline" loading={loading} color="amber" />
        {pipelineWeightedAgent !== pipelineExpectedAgent && (
          <KpiCard value={formatEur(pipelineWeightedAgent)} label="Comm. pesate prob." loading={loading} color="green" />
        )}
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
