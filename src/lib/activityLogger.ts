import { supabase } from './supabase'

export async function logAction(actionType: string, details?: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('agent_activity_logs').insert({
      agent_id: user.id,
      action_type: actionType,
      details: details || {},
    })
  } catch {
    // Silent fail — logging should never break the app
  }
}
