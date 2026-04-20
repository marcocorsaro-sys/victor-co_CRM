type Props = {
  value: string
  label: string
  color?: string
  loading?: boolean
  onClick?: () => void
}

export default function KpiCard({ value, label, color, loading, onClick }: Props) {
  if (loading) {
    return <div className="kpi-card"><div className="skeleton skeleton-kpi" /></div>
  }

  return (
    <div className={`kpi-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className={`kpi-value ${color || ''}`}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
