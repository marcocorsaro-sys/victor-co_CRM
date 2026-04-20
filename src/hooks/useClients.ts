import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/activityLogger'
import type { Client } from '../lib/supabase'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })

    if (!error && data) {
      setClients(data as Client[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    const channel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => { fetchClients() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchClients])

  const addClient = async (client: Partial<Client>) => {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single()

    if (!error && data) {
      setClients(prev => [...prev, data as Client].sort((a, b) => a.name.localeCompare(b.name)))
      logAction('client_created', { name: (data as Client).name })
    }
    return { data, error }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      fetchClients()
    } else if (data) {
      setClients(prev => prev.map(c => c.id === id ? (data as Client) : c))
      logAction('client_edited', { name: (data as Client).name })
    }
    return { data, error }
  }

  const deleteClient = async (id: string) => {
    const deleted = clients.find(c => c.id === id)
    setClients(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { fetchClients() }
    else { logAction('client_deleted', { name: deleted?.name }) }
    return { error }
  }

  return { clients, loading, addClient, updateClient, deleteClient, refetch: fetchClients }
}
