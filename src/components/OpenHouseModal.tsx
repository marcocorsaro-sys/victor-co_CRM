import { useState, useEffect } from 'react'
import type { OpenHouse } from '../hooks/useOpenHouses'
import type { OperationWithAgent, Profile } from '../lib/supabase'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<OpenHouse>) => void
  initial?: OpenHouse | null
  operations: OperationWithAgent[]
  agentId?: string
  agents?: Profile[]
}

export default function OpenHouseModal({ open, onClose, onSave, initial, operations, agentId }: Props) {
  const [form, setForm] = useState({
    operation_id: '',
    agent_id: '',
    title: '',
    description: '',
    start_date: '',
    start_time: '10:00',
    end_date: '',
    end_time: '12:00',
    location: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initial) {
      const startDt = new Date(initial.start_datetime)
      const endDt = new Date(initial.end_datetime)
      setForm({
        operation_id: initial.operation_id,
        agent_id: initial.agent_id,
        title: initial.title,
        description: initial.description || '',
        start_date: startDt.toISOString().split('T')[0],
        start_time: startDt.toTimeString().slice(0, 5),
        end_date: endDt.toISOString().split('T')[0],
        end_time: endDt.toTimeString().slice(0, 5),
        location: initial.location || '',
        notes: initial.notes || '',
        status: initial.status,
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setForm({
        operation_id: '',
        agent_id: agentId || '',
        title: '',
        description: '',
        start_date: today,
        start_time: '10:00',
        end_date: today,
        end_time: '12:00',
        location: '',
        notes: '',
        status: 'scheduled',
      })
    }
    setErrors({})
  }, [initial, open, agentId])

  if (!open) return null

  const isEditing = !!initial

  const pipelineOps = operations.filter(o => o.status === 'pipeline')

  const handleOpChange = (opId: string) => {
    const op = operations.find(o => o.id === opId)
    setForm(prev => ({
      ...prev,
      operation_id: opId,
      title: op ? `Open House - ${op.property_name}` : prev.title,
      location: op?.address || prev.location,
      agent_id: op?.agent_id || prev.agent_id,
    }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.operation_id) errs.operation_id = 'Seleziona un immobile'
    if (!form.title.trim()) errs.title = 'Campo obbligatorio'
    if (!form.start_date) errs.start_date = 'Campo obbligatorio'
    if (!form.end_date) errs.end_date = 'Campo obbligatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSave({
      operation_id: form.operation_id,
      agent_id: form.agent_id || agentId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_datetime: `${form.start_date}T${form.start_time}:00`,
      end_datetime: `${form.end_date}T${form.end_time}:00`,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    })
  }

  const set = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-title">{isEditing ? 'Modifica Open House' : 'Nuovo Open House'}</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Immobile *</label>
            <select
              className={`form-select ${errors.operation_id ? 'error' : ''}`}
              value={form.operation_id}
              onChange={e => handleOpChange(e.target.value)}
            >
              <option value="">Seleziona immobile...</option>
              {pipelineOps.map(op => (
                <option key={op.id} value={op.id}>
                  {op.property_name} {op.address ? `— ${op.address}` : ''}
                </option>
              ))}
            </select>
            {errors.operation_id && <div className="form-error">{errors.operation_id}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Titolo *</label>
            <input
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Open House - Nome immobile"
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data inizio *</label>
              <input className={`form-input ${errors.start_date ? 'error' : ''}`} type="date"
                value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Ora inizio</label>
              <input className="form-input" type="time" value={form.start_time}
                onChange={e => set('start_time', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data fine *</label>
              <input className={`form-input ${errors.end_date ? 'error' : ''}`} type="date"
                value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Ora fine</label>
              <input className="form-input" type="time" value={form.end_time}
                onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Luogo</label>
            <input className="form-input" value={form.location}
              onChange={e => set('location', e.target.value)} placeholder="Indirizzo" />
          </div>

          <div className="form-group">
            <label className="form-label">Descrizione</label>
            <textarea className="form-input" rows={2} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Dettagli..." />
          </div>

          {isEditing && (
            <div className="form-group">
              <label className="form-label">Stato</label>
              <select className="form-select" value={form.status}
                onChange={e => set('status', e.target.value)}>
                <option value="scheduled">Programmato</option>
                <option value="completed">Completato</option>
                <option value="cancelled">Annullato</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea className="form-input" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Note..." />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Salva modifiche' : 'Crea Open House'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
