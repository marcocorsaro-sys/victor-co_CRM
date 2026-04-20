import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { GoogleIntegration } from '../lib/googleTypes'

export function useGoogleIntegration() {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('google_integrations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    setIntegration(data as GoogleIntegration | null)
    setLoading(false)
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return { integration, loading, refetch: checkStatus }
}
