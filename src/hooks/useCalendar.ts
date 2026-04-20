import { useState, useCallback } from 'react'
import type { CalendarEvent } from '../lib/googleTypes'
import { googleApiCall } from '../lib/googleApi'

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true)
    try {
      const data = await googleApiCall<{ events: CalendarEvent[] }>('calendar-list', {
        timeMin: startDate,
        timeMax: endDate,
      })
      setEvents(data.events || [])
    } catch {
      setEvents([])
    }
    setLoading(false)
  }, [])

  const createEvent = useCallback(async (event: Partial<CalendarEvent>) => {
    return googleApiCall<CalendarEvent>('calendar-create', { event })
  }, [])

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    return googleApiCall<CalendarEvent>('calendar-update', { eventId, ...updates })
  }, [])

  const deleteEvent = useCallback(async (eventId: string) => {
    return googleApiCall<void>('calendar-delete', { eventId })
  }, [])

  return { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent }
}
