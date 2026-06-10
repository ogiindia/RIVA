// Frontend/src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useWebSocket(username, onAlert, ready = true) {
  const [wsStatus, setWsStatus] = useState('connecting')
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const pingInterval = useRef(null)
  const mountedRef = useRef(true)
  const onAlertRef = useRef(onAlert)

  useEffect(() => { onAlertRef.current = onAlert }, [onAlert])

  const connect = useCallback(() => {
    if (!username || !ready || !mountedRef.current) return
    const envBase = import.meta.env.VITE_WS_URL
    const base = envBase
      ? envBase.replace(/\/+$/, '')
      : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`
    const url = `${base}/ws/${encodeURIComponent(username)}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setWsStatus('connected')
      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 30000)
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'alert') {
          toast(`New alert: ${data.alert_id}`, {
            icon: '🔔',
            className: 'toast-custom',
            duration: 5000,
          })
          onAlertRef.current?.(data.alert_id)
        }
      } catch {}
    }

    ws.onclose = (event) => {
      clearInterval(pingInterval.current)
      if (!mountedRef.current) return
      if (event.code === 4001 || event.code === 4003) {
        setWsStatus('session_invalid')
        toast.error('WebSocket session invalid. Please refresh.', { id: 'ws-error', duration: 5000 })
      } else {
        setWsStatus('disconnected')
        toast('WebSocket disconnected — reconnecting...', { id: 'ws-status', icon: '\u26a0\ufe0f', duration: 3000 })
        reconnectTimer.current = setTimeout(connect, 3000)
      }
    }

    ws.onerror = () => ws.close()
  }, [username, ready])

  useEffect(() => {
    mountedRef.current = true
    if (ready) connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      clearInterval(pingInterval.current)
      wsRef.current?.close()
    }
  }, [connect, ready])

  return { wsStatus }
}
