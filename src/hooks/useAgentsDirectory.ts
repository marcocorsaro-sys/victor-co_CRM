import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

/**
 * Directory degli agent attivi accessibile a tutti gli utenti autenticati
 * (incluso ruolo `agent` che normalmente non può leggere altri profili).
 *
 * Necessario per il dropdown "Collaboratore interno" nelle operazioni condivise
 * sul dashboard degli agenti.
 *
 * Espone solo campi safe (no iban / cf / indirizzi / telefoni / contratto).
 * Backed by Postgres SECURITY DEFINER function `public.get_agents_directory()`.
 */
export function useAgentsDirectory() {
  const [agents, setAgents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_agents_directory')
    if (!error && data) {
      setAgents(data as Profile[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return { agents, loading, refetch: fetchAgents }
}
