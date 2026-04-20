import { supabase } from './supabase'

async function callAdminAction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action, ...payload },
  })

  if (error) {
    // FunctionsHttpError stores the response body in .context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = (error as any).context
    const msg = ctx?.error || error.message || 'Errore nell\'operazione admin'
    throw new Error(msg)
  }

  // Edge function returns { error: "..." } in body for app-level errors
  if (data?.error) {
    throw new Error(data.error)
  }

  return data as T
}

export async function createUser(data: {
  email: string
  password: string
  first_name: string
  last_name: string
  color: string
  role: 'admin' | 'agent'
  comm_pct_agency: number
  comm_pct_agent: number
}) {
  return callAdminAction<{ user_id: string }>('create-user', data)
}

export async function updateAgentEmail(userId: string, newEmail: string) {
  return callAdminAction<{ success: boolean }>('update-email', {
    user_id: userId,
    new_email: newEmail,
  })
}

export async function resetAgentPassword(userId: string, newPassword: string) {
  return callAdminAction<{ success: boolean }>('reset-password', {
    user_id: userId,
    new_password: newPassword,
  })
}
