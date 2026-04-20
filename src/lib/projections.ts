import type { Operation, Profile } from './supabase'
import { calculateCommissions } from './calculations'

export interface MonthlyProjection {
  month: number
  actual: number
  projected: number
  cumulative: number
  cumulativeProjected: number
}

export interface ProjectionBreakdown {
  ytdActual: number
  avgMonthly: number
  monthsWithOps: number
  closeRate: number
  pipelineGrossTotal: number
  pipelineWeightedByProb: number
  trendComponent: number
  pipelineComponent: number
  projectedTotal: number
  remainingMonths: number
}

export function calculateProjectedTrajectory(
  completedOps: Operation[],
  pipelineOps: Operation[],
  agents: Profile[],
  year: number,
): { monthly: MonthlyProjection[]; breakdown: ProjectionBreakdown } {
  const now = new Date()
  const currentMonth = now.getFullYear() === year ? now.getMonth() : 11

  // Actual monthly commissions
  const actuals = Array(12).fill(0)
  completedOps.forEach(o => {
    if (!o.sale_date) return
    const d = new Date(o.sale_date)
    if (d.getFullYear() !== year) return
    actuals[d.getMonth()] += o.gross_commission || 0
  })

  const ytdActual = actuals.slice(0, currentMonth + 1).reduce((a, b) => a + b, 0)

  // Historical close rate (last 12 months)
  const allRecent = [...completedOps, ...pipelineOps]
  const completedCount = completedOps.filter(o => {
    if (!o.sale_date) return false
    const d = new Date(o.sale_date)
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    return monthsAgo >= 0 && monthsAgo < 12
  }).length
  const totalCount = allRecent.length || 1
  const closeRate = Math.min(completedCount / totalCount, 1)

  // Average monthly commission from completed months (only months with ops)
  const completedMonthsList = actuals.filter((v, i) => i <= currentMonth && v > 0)
  const monthsWithOps = completedMonthsList.length || 1
  const avgMonthly = completedMonthsList.length > 0
    ? completedMonthsList.reduce((a, b) => a + b, 0) / completedMonthsList.length
    : 0

  // Pipeline expected value — WEIGHTED BY SALE PROBABILITY
  let pipelineGrossTotal = 0
  let pipelineWeightedByProb = 0
  pipelineOps.forEach(op => {
    if (!op.property_value) return
    const agent = agents.find(a => a.id === op.agent_id)
    if (!agent) return
    const result = calculateCommissions(
      op.property_value, op.comm_pct_seller, op.comm_pct_buyer,
      op.origin, agent.comm_pct_agency, agent.comm_pct_agent
    )
    pipelineGrossTotal += result.grossCommission
    // Weight by probability: 30%→0.3, 60%→0.6, 90%→0.9, null→closeRate
    const probWeight = op.sale_probability ? op.sale_probability / 100 : closeRate
    pipelineWeightedByProb += result.grossCommission * probWeight
  })

  const remainingMonths = Math.max(11 - currentMonth, 1)
  const pipelinePerMonth = pipelineWeightedByProb / remainingMonths

  // Projection formula for each future month:
  // 50% trend (avg monthly YTD) + 50% pipeline weighted by probability
  const trendComponent = avgMonthly * 0.5
  const pipelineComponent = pipelinePerMonth * 0.5
  const monthlyProjected = trendComponent + pipelineComponent

  // Build monthly projection
  const monthly: MonthlyProjection[] = []
  let cumActual = 0
  let cumProjected = 0

  for (let m = 0; m < 12; m++) {
    const actual = actuals[m]
    const projected = m <= currentMonth ? actual : monthlyProjected
    cumActual += actual
    cumProjected += m <= currentMonth ? actual : projected

    monthly.push({
      month: m,
      actual,
      projected: m <= currentMonth ? 0 : projected,
      cumulative: cumActual,
      cumulativeProjected: cumProjected,
    })
  }

  const projectedTotal = monthly[11]?.cumulativeProjected || 0

  const breakdown: ProjectionBreakdown = {
    ytdActual,
    avgMonthly,
    monthsWithOps,
    closeRate,
    pipelineGrossTotal,
    pipelineWeightedByProb,
    trendComponent,
    pipelineComponent,
    projectedTotal,
    remainingMonths,
  }

  return { monthly, breakdown }
}
