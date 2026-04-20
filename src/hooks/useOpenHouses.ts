import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type OpenHouse = {
  id: string
  operation_id: string
  agent_id: string
  title: string
  description: string | null
  start_datetime: string
  end_datetime: string
  location: string | null
  notes: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  google_calendar_event_id: string | null
  created_at: string
  updated_at: string
}

export function useOpenHouses(agentId?: string) {
  const [openHouses, setOpenHouses] = useState<OpenHouse[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOpenHouses = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('open_houses')
      .select('*')
      .order('start_datetime', { ascending: true })

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query

    if (!error && data) {
      setOpenHouses(data as OpenHouse[])
    }
    setLoading(false)
  }, [agentId])

  useEffect(() => {
    fetchOpenHouses()
  }, [fetchOpenHouses])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('open-houses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'open_houses' },
        () => { fetchOpenHouses() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOpenHouses])

  const addOpenHouse = async (oh: Partial<OpenHouse>) => {
    const { data, error } = await supabase
      .from('open_houses')
      .insert(oh)
      .select('*')
      .single()

    if (!error && data) {
      setOpenHouses(prev => [...prev, data as OpenHouse])
    }
    return { data, error }
  }

  const updateOpenHouse = async (id: string, updates: Partial<OpenHouse>) => {
    const { data, error } = await supabase
      .from('open_houses')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (!error && data) {
      setOpenHouses(prev =>
        prev.map(oh => (oh.id === id ? (data as OpenHouse) : oh))
      )
    }
    return { data, error }
  }

  const deleteOpenHouse = async (id: string) => {
    setOpenHouses(prev => prev.filter(oh => oh.id !== id))
    const { error } = await supabase.from('open_houses').delete().eq('id', id)
    if (error) { fetchOpenHouses() }
    return { error }
  }

  return { openHouses, loading, addOpenHouse, updateOpenHouse, deleteOpenHouse, refetch: fetchOpenHouses }
}
