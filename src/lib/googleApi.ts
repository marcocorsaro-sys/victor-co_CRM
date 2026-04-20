import { supabase } from './supabase'

export async function googleApiCall<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('google-api-proxy', {
    body: { action, ...payload },
  })
  if (error) throw new Error(error.message || 'Errore nella chiamata Google API')
  if (data?.error) throw new Error(data.error)
  return data as T
}

export async function getGoogleAuthUrl(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('google-oauth', {
    body: { action: 'get-auth-url' },
  })
  if (error) throw new Error(error.message)
  return data.url
}

export async function disconnectGoogle(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('google-oauth', {
    body: { action: 'disconnect' },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
}
