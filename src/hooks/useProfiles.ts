import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (!error && data) {
      setProfiles(data as Profile[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const agents = profiles.filter(p => p.role === 'agent')
  const activeAgents = agents.filter(p => p.active)

  return { profiles, agents, activeAgents, loading, refetch: fetchProfiles }
}
