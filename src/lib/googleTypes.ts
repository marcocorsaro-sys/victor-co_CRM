export type GoogleIntegration = {
  id: string
  user_id: string
  gmail_connected: boolean
  calendar_connected: boolean
  scopes: string[]
  created_at: string
  updated_at: string
}

export type GmailMessage = {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  date: string
  body: string
  isRead: boolean
}

export type CalendarEvent = {
  id: string
  summary: string
  description: string
  start: string
  end: string
  location: string
  htmlLink: string
}
