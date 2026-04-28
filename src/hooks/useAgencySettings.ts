import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AgencySettings } from '../lib/supabase'

/**
 * Hook che legge la riga unica `agency_settings` (id = 1).
 * Usato per popolare automaticamente i campi Agenzia della modulistica
 * (intestazione PDF, sede, P.IVA, REA, polizza FIAIP, ecc.).
 */
export function useAgencySettings() {
  const [settings, setSettings] = useState<AgencySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('agency_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (err) setError(err.message)
    else setSettings(data as AgencySettings | null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const update = useCallback(async (patch: Partial<AgencySettings>) => {
    const { data, error: err } = await supabase
      .from('agency_settings')
      .upsert({ id: 1, ...patch }, { onConflict: 'id' })
      .select()
      .maybeSingle()
    if (err) return { error: err.message }
    setSettings(data as AgencySettings)
    return { data }
  }, [])

  return { settings, loading, error, update, refetch: fetchSettings }
}
