import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

import { useApp } from './context/AppContext'
import { useTheme } from './hooks/useTheme'
import { createRivaSession, checkRivaHealth } from './api/riva'

import { TopBar } from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import LandingView from './components/views/LandingView'
import ChatView from './components/views/ChatView'

import './styles/app.css'

// Username is injected by the server or passed as a query param
const resolveUserId = () => {
  if (window.__APP_USERNAME__) return window.__APP_USERNAME__
  const params = new URLSearchParams(window.location.search)
  return params.get('username') || 'analyst'
}

const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
const VIEW_STYLE = { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }

export default function App() {
  const { state, dispatch } = useApp()
  const [backendStatus, setBackendStatus] = useState('connecting') // 'connecting'|'up'|'down'

  useTheme()

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => document.body.classList.add('app-entered'))
  }, [])

  // Bootstrap — session init + health check (runs once; ignore StrictMode double-invoke)
  useEffect(() => {
    const userId = resolveUserId()
    dispatch({ type: 'SET_USER_ID', payload: userId })

    let cancelled = false

    async function init() {
      const healthy = await checkRivaHealth()
      if (cancelled) return

      if (!healthy) {
        setBackendStatus('down')
        toast.error('RIVA backend is unreachable. Is the Java server running on :8080?', {
          duration: 8000,
        })
        return
      }
      setBackendStatus('up')

      try {
        await createRivaSession(userId)
        if (!cancelled) toast.success(`Session ready — welcome, ${userId}`, { duration: 2500 })
      } catch (err) {
        if (!cancelled) toast.error(`Session init failed: ${err.message}`, { duration: 5000 })
      }
    }

    init()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isChat = state.view === 'chat'

  return (
    <>
      <Toaster
        position="top-right"
        containerStyle={{ top: 70 }}
        toastOptions={{
          className: 'toast-custom',
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '0.82rem',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'var(--error)',   secondary: '#fff' } },
        }}
      />

      <div className="app-layout">
        <Sidebar />

        <div className="main-content">
          <TopBar backendStatus={backendStatus} />

          <AnimatePresence mode="wait">
            {isChat ? (
              <motion.div key="chat" {...FADE} transition={{ duration: 0.18 }} style={VIEW_STYLE}>
                <ChatView />
              </motion.div>
            ) : (
              <motion.div key="landing" {...FADE} transition={{ duration: 0.18 }} style={VIEW_STYLE}>
                <LandingView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
