import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { OperationWithAgent } from '../lib/supabase'

/**
 * Hook che ritorna le operazioni in cui l'utente è COLLABORATORE INTERNO
 * (collaborator_id = userId), ossia non le sue ma quelle in cui prenderà
 * comunque una quota della commissione dell'agente principale.
 *
 * Backed by RLS policy `agent_collaborator_read`.
 */
export function useCollaboratedOperations(userId: string | undefined) {
  const [operations, setOperations] = useState<OperationWithAgent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOperations = useCallback(async () => {
    if (!userId) { setOperations([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('operations')
      .select('*, profiles!agent_id(*)')
      .eq('collaborator_id', userId)
      .order('date_added', { ascending: false })
    if (!error && data) setOperations(data as OperationWithAgent[])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchOperations() }, [fetchOperations])

  return { operations, loading, refetch: fetchOperations }
}
