import { useState, useCallback } from 'react'
import type { GmailMessage } from '../lib/googleTypes'
import { googleApiCall } from '../lib/googleApi'

export function useGmail() {
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(false)

  const searchEmails = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const data = await googleApiCall<{ messages: GmailMessage[] }>('gmail-list', { query })
      setMessages(data.messages || [])
    } catch {
      setMessages([])
    }
    setLoading(false)
  }, [])

  const readEmail = useCallback(async (messageId: string) => {
    return googleApiCall<GmailMessage>('gmail-read', { messageId })
  }, [])

  const sendEmail = useCallback(async (to: string, subject: string, body: string) => {
    return googleApiCall<{ success: boolean }>('gmail-send', { to, subject, body })
  }, [])

  return { messages, loading, searchEmails, readEmail, sendEmail }
}
