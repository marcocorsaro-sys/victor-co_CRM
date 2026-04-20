import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type ActivityLog = {
  id: string
  agent_id: string
  action_type: string
  details: Record<string, unknown>
  created_at: string
}

export type AgentStats = {
  agent_id: string
  last_login: string | null
  actions_7d: number
  actions_30d: number
  last_action_type: string | null
  last_action_time: string | null
}

export function useActivityStats() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)

    // Fetch recent logs (last 100)
    const { data: recentLogs } = await supabase
      .from('agent_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    setLogs((recentLogs || []) as ActivityLog[])

    // Fetch all logs for stats computation
    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: logs7 } = await supabase
      .from('agent_activity_logs')
      .select('agent_id')
      .gte('created_at', d7)

    const { data: logs30 } = await supabase
      .from('agent_activity_logs')
      .select('agent_id')
      .gte('created_at', d30)

    // Compute per-agent stats
    const agentMap = new Map<string, AgentStats>()

    // Count 7-day actions
    ;(logs7 || []).forEach(l => {
      const s = agentMap.get(l.agent_id) || {
        agent_id: l.agent_id, last_login: null,
        actions_7d: 0, actions_30d: 0,
        last_action_type: null, last_action_time: null,
      }
      s.actions_7d++
      agentMap.set(l.agent_id, s)
    })

    // Count 30-day actions
    ;(logs30 || []).forEach(l => {
      const s = agentMap.get(l.agent_id) || {
        agent_id: l.agent_id, last_login: null,
        actions_7d: 0, actions_30d: 0,
        last_action_type: null, last_action_time: null,
      }
      s.actions_30d++
      agentMap.set(l.agent_id, s)
    })

    // Get last login and last action from recent logs
    ;(recentLogs || []).forEach((l: ActivityLog) => {
      const s = agentMap.get(l.agent_id)
      if (!s) return
      if (!s.last_action_time) {
        s.last_action_type = l.action_type
        s.last_action_time = l.created_at
      }
      if (l.action_type === 'login' && !s.last_login) {
        s.last_login = l.created_at
      }
    })

    setStats(Array.from(agentMap.values()))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { logs, stats, loading, refetch: fetchStats }
}
