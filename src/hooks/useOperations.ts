import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/activityLogger'
import type { Operation, OperationWithAgent } from '../lib/supabase'

export function useOperations(agentId?: string) {
  const [operations, setOperations] = useState<OperationWithAgent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOperations = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('operations')
      .select('*, profiles!agent_id(*)')
      .order('date_added', { ascending: false })

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query

    if (!error && data) {
      setOperations(data as OperationWithAgent[])
    }
    setLoading(false)
  }, [agentId])

  useEffect(() => {
    fetchOperations()
  }, [fetchOperations])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('operations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'operations' },
        () => {
          fetchOperations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOperations])

  const addOperation = async (op: Partial<Operation>) => {
    const { data, error } = await supabase
      .from('operations')
      .insert(op)
      .select('*, profiles!agent_id(*)')
      .single()

    if (!error && data) {
      setOperations(prev => [data as OperationWithAgent, ...prev])
      logAction('operation_created', { property: (data as OperationWithAgent).property_name })
    }
    return { data, error }
  }

  const updateOperation = async (id: string, updates: Partial<Operation>) => {
    // Optimistic update
    setOperations(prev =>
      prev.map(op => (op.id === id ? { ...op, ...updates } : op))
    )

    const { data, error } = await supabase
      .from('operations')
      .update(updates)
      .eq('id', id)
      .select('*, profiles!agent_id(*)')
      .single()

    if (error) {
      // Revert on error
      fetchOperations()
    } else if (data) {
      setOperations(prev =>
        prev.map(op => (op.id === id ? (data as OperationWithAgent) : op))
      )
      const d = data as OperationWithAgent
      const actionType = updates.status === 'incassato' ? 'operation_closed' : 'operation_edited'
      logAction(actionType, { property: d.property_name })
    }
    return { data, error }
  }

  const deleteOperation = async (id: string) => {
    const deleted = operations.find(op => op.id === id)
    // Optimistic removal
    setOperations(prev => prev.filter(op => op.id !== id))

    const { error } = await supabase.from('operations').delete().eq('id', id)

    if (error) {
      fetchOperations()
    } else {
      logAction('operation_deleted', { property: deleted?.property_name })
    }
    return { error }
  }

  return { operations, loading, addOperation, updateOperation, deleteOperation, refetch: fetchOperations }
}
