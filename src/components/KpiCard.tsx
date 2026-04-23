import type { ReactNode } from 'react'

type Props = {
  value: string
  label: string
  color?: string
  loading?: boolean
  onClick?: () => void
  /** Optional legend element (e.g. <FormulaTip/>) rendered next to the label. */
  legend?: ReactNode
}

export default function KpiCard({ value, label, color, loading, onClick, legend }: Props) {
  if (loading) {
    return <div className="kpi-card"><div className="skeleton skeleton-kpi" /></div>
  }

  return (
    <div className={`kpi-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer', position: 'relative' } : { position: 'relative' }}>
      <div className={`kpi-value ${color || ''}`}>{value}</div>
      <div className="kpi-label" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span>{label}</span>
        {legend}
      </div>
    </div>
  )
}
