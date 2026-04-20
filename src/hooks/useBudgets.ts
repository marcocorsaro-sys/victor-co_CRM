import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AnnualBudget, AgentBudgetAllocation } from '../lib/supabase'

export function useBudgets(year: number) {
  const [budget, setBudgetState] = useState<AnnualBudget | null>(null)
  const [allocations, setAllocations] = useState<AgentBudgetAllocation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBudget = useCallback(async () => {
    setLoading(true)

    const { data: b } = await supabase
      .from('annual_budgets')
      .select('*')
      .eq('year', year)
      .maybeSingle()

    setBudgetState(b as AnnualBudget | null)

    if (b) {
      const { data: allocs } = await supabase
        .from('agent_budget_allocations')
        .select('*')
        .eq('budget_id', b.id)

      setAllocations((allocs || []) as AgentBudgetAllocation[])
    } else {
      setAllocations([])
    }

    setLoading(false)
  }, [year])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  const setBudget = async (totalTarget: number) => {
    const { data, error } = await supabase
      .from('annual_budgets')
      .upsert({ year, total_target: totalTarget }, { onConflict: 'year' })
      .select()
      .single()

    if (!error && data) {
      setBudgetState(data as AnnualBudget)
    }
    return { data, error }
  }

  const setAllocation = async (agentId: string, allocatedTarget: number) => {
    if (!budget) return { data: null, error: new Error('Budget non impostato') }

    const { data, error } = await supabase
      .from('agent_budget_allocations')
      .upsert(
        { budget_id: budget.id, agent_id: agentId, allocated_target: allocatedTarget },
        { onConflict: 'budget_id,agent_id' }
      )
      .select()
      .single()

    if (!error && data) {
      setAllocations(prev => {
        const existing = prev.findIndex(a => a.agent_id === agentId)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = data as AgentBudgetAllocation
          return updated
        }
        return [...prev, data as AgentBudgetAllocation]
      })
    }
    return { data, error }
  }

  const deleteAllocation = async (agentId: string) => {
    if (!budget) return
    await supabase
      .from('agent_budget_allocations')
      .delete()
      .eq('budget_id', budget.id)
      .eq('agent_id', agentId)

    setAllocations(prev => prev.filter(a => a.agent_id !== agentId))
  }

  return { budget, allocations, loading, setBudget, setAllocation, deleteAllocation, refetch: fetchBudget }
}
