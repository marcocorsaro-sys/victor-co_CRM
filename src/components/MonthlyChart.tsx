import { useEffect, useRef } from 'react'
import { Chart, BarController, LineController, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import type { OperationWithAgent } from '../lib/supabase'

Chart.register(BarController, LineController, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

type Props = {
  operations: OperationWithAgent[]
}

function getLast12Months(): { label: string; year: number; month: number }[] {
  const months: { label: string; year: number; month: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }).toUpperCase(),
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }
  return months
}

export default function MonthlyChart({ operations }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const months = getLast12Months()
    const completed = operations.filter(o => o.status === 'completata' && o.sale_date)

    const data = months.map(m => {
      const ops = completed.filter(o => {
        const d = new Date(o.sale_date!)
        return d.getFullYear() === m.year && d.getMonth() === m.month
      })
      return {
        gross: ops.reduce((s, o) => s + (o.gross_commission || 0), 0),
        agent: ops.reduce((s, o) => s + (o.agent_commission || 0), 0),
        agency: ops.reduce((s, o) => s + ((o.gross_commission || 0) - (o.agent_commission || 0)), 0),
        count: ops.length,
      }
    })

    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [
          {
            label: 'Comm. Totali',
            data: data.map(d => d.gross),
            backgroundColor: '#c8e64a',
            borderRadius: 4,
            order: 2,
          },
          {
            label: 'Quota Agenti',
            data: data.map(d => d.agent),
            backgroundColor: '#f59e0b',
            borderRadius: 4,
            order: 3,
          },
          {
            label: 'Margine Agenzia',
            data: data.map(d => d.agency),
            backgroundColor: '#2dd4bf',
            borderRadius: 4,
            order: 4,
          },
          {
            label: 'Operazioni',
            data: data.map(d => d.count),
            type: 'line',
            borderColor: '#f0f2f5',
            backgroundColor: 'rgba(240, 242, 245, 0.1)',
            yAxisID: 'y1',
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#f0f2f5',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#9ca3af',
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 12,
            },
          },
          tooltip: {
            backgroundColor: '#161920',
            titleColor: '#f0f2f5',
            bodyColor: '#9ca3af',
            borderColor: '#1e2233',
            borderWidth: 1,
            padding: 10,
            titleFont: { family: "'JetBrains Mono', monospace", size: 12 },
            bodyFont: { family: "'Inter', sans-serif", size: 12 },
            callbacks: {
              label: (ctx: any) => {
                if (ctx.dataset.yAxisID === 'y1') {
                  return `${ctx.dataset.label}: ${ctx.parsed.y}`
                }
                return `${ctx.dataset.label}: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(ctx.parsed.y)}`
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#6b7280', font: { family: "'JetBrains Mono', monospace", size: 10 } },
            grid: { color: 'rgba(30, 34, 51, 0.5)' },
          },
          y: {
            position: 'left',
            ticks: {
              color: '#6b7280',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: (v: string | number) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v,
            },
            grid: { color: 'rgba(30, 34, 51, 0.5)' },
          },
          y1: {
            position: 'right',
            ticks: {
              color: '#6b7280',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              stepSize: 1,
            },
            grid: { display: false },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [operations])

  return (
    <div className="chart-wrap">
      <div className="section-heading">Andamento Mensile</div>
      <div style={{ height: 340 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
