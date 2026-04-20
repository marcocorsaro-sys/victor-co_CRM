import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Valutazione, ValutazioneWithAgent } from '../lib/supabase'
import * as api from '../lib/valutazioni'

export function useValuations(agentId?: string) {
  const [valutazioni, setValutazioni] = useState<ValutazioneWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  const fetch = useCallback(async () => {
    setLoading(true)
    if (agentId) {
      const { data } = await api.getValutazioni(agentId, year)
      setValutazioni((data || []) as ValutazioneWithAgent[])
    } else {
      const { data } = await api.getAllValutazioni(year)
      setValutazioni((data || []) as ValutazioneWithAgent[])
    }
    setLoading(false)
  }, [agentId, year])

  useEffect(() => { fetch() }, [fetch])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('valutazioni_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'valutazioni' }, () => {
        fetch()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch])

  const create = async (fields: Partial<Valutazione>) => {
    const { data, error } = await api.createValutazione(fields)
    if (!error) fetch()
    return { data, error }
  }

  const update = async (id: string, fields: Partial<Valutazione>) => {
    const { data, error } = await api.updateValutazione(id, fields)
    if (!error) fetch()
    return { data, error }
  }

  const remove = async (id: string) => {
    const { error } = await api.deleteValutazione(id)
    if (!error) fetch()
    return { error }
  }

  const convertToIncarico = async (id: string) => {
    const operation = await api.setIncaricoPreso(id)
    fetch()
    return operation
  }

  return {
    valutazioni, loading, year, setYear,
    createValutazione: create,
    updateValutazione: update,
    deleteValutazione: remove,
    setIncaricoPreso: convertToIncarico,
  }
}
