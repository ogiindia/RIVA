// Frontend/src/hooks/useAlertHistory.js
import { useState, useCallback, useRef } from 'react'
import { getAlertList } from '../api/client'

const PAGE_SIZE = 20

export function useAlertHistory() {
  const [alerts, setAlerts] = useState([])   // [{ alert_id, is_closed }]
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const offsetRef = useRef(0)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(false)

  const load = useCallback(async (reset = false) => {
    if (loadingRef.current) return
    if (!reset && !hasMoreRef.current) return
    loadingRef.current = true
    setLoading(true)

    const offset = reset ? 0 : offsetRef.current
    try {
      const data = await getAlertList(offset, PAGE_SIZE)
      const newAlerts = data.alerts || []
      setAlerts(prev => {
        const existing = reset ? [] : prev
        const existingIds = new Set(existing.map(a => a.alert_id))
        const merged = [...existing, ...newAlerts.filter(a => !existingIds.has(a.alert_id))]
        return merged
      })
      offsetRef.current = offset + newAlerts.length
      hasMoreRef.current = !!data.has_more
      setHasMore(!!data.has_more)
    } catch (err) {
      console.error('Failed to load alert history:', err)
    }
    finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  const addAlert = useCallback((alertId) => {
    setAlerts(prev => {
      if (prev.some(a => a.alert_id === alertId)) return prev
      return [{ alert_id: alertId, is_closed: false }, ...prev]
    })
  }, [])

  const removeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.alert_id !== alertId))
  }, [])

  const markClosed = useCallback((alertId) => {
    setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, is_closed: true } : a))
  }, [])

  return { alerts, hasMore, loading, load, addAlert, removeAlert, markClosed }
}
