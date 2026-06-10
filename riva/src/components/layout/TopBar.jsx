import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Moon, ArrowLeft, ServerCrash, Server } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../hooks/useTheme'

const THEME_ICONS  = { light: <Sun size={14} />, dark: <Moon size={14} /> }
const THEME_LABELS = { light: 'Light', dark: 'Dark' }

function BackendStatus({ status }) {
  const isUp   = status === 'up'
  const isDown = status === 'down'
  return (
    <div className="ws-status" title={isUp ? 'RIVA backend connected' : isDown ? 'Backend unreachable' : 'Connecting...'}>
      <motion.span
        className={`ws-dot ${isUp ? 'connected' : 'disconnected'}`}
        animate={{ opacity: isUp ? 1 : [1, 0.3, 1] }}
        transition={{ repeat: isUp ? 0 : Infinity, duration: 1.5 }}
      />
      <span>{isUp ? 'Backend UP' : isDown ? 'Backend DOWN' : 'Connecting...'}</span>
      {isDown ? <ServerCrash size={13} style={{ color: 'var(--error)' }} /> : <Server size={13} />}
    </div>
  )
}

export function TopBar({ backendStatus }) {
  const { state, dispatch } = useApp()
  const { theme, cycleTheme } = useTheme()
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('en-GB'))

  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB')), 1000)
    return () => clearInterval(id)
  }, [])

  const isChat = state.view === 'chat'

  return (
    <div className="top-bar">
      <span className="page-heading">Risk Investigator Virtual Assistant</span>

      <div className="top-bar-center">
        <AnimatePresence>
          {isChat && state.currentCaseId && (
            <motion.span
              key="case-badge"
              className="chat-alert-badge"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
            >
              {state.currentCaseId}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="top-bar-right">
        <BackendStatus status={backendStatus} />

        <span className="clock">{clock}</span>

        <button
          className="theme-toggle-btn"
          onClick={cycleTheme}
          title={`Theme: ${THEME_LABELS[theme] ?? theme}`}
          aria-label="Cycle theme"
        >
          {THEME_ICONS[theme] ?? <Sun size={14} />}
          {THEME_LABELS[theme] ?? theme}
        </button>

        <AnimatePresence>
          {isChat && (
            <motion.button
              key="back-btn"
              className="btn-icon-sm"
              onClick={() => dispatch({ type: 'SHOW_LANDING' })}
              title="Back to home"
              aria-label="Back to home"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowLeft size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
