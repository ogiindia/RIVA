import { useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

const THEME_VARS = {
  dark: {
    '--bg-primary':'#000000','--bg-secondary':'#0a0a0a','--bg-card':'#1a1a1a','--bg-hover':'#262626',
    '--border':'#262626','--text-primary':'#f5f5f5','--text-secondary':'#a1a1aa','--text-muted':'#71717a',
    '--accent':'#06b6d4','--accent-hover':'#22d3ee','--accent-glow':'rgba(6,182,212,0.18)','--accent-rgb':'6,182,212',
    '--msg-user-bg':'#f97316','--msg-agent-bg':'#ffffff',
    '--msg-user-text':'#ffffff','--msg-agent-text':'#111111',
    '--stream-dot':'#ffffff',
    '--brand-warm':'#f97316','--brand-warm-rgb':'249,115,22',
  },
  light: {
    '--bg-primary':'#f8fafc','--bg-secondary':'#e2e8f0','--bg-card':'#ffffff','--bg-hover':'#cbd5e1',
    '--border':'#cbd5e1','--text-primary':'#111827','--text-secondary':'#4b5563','--text-muted':'#6b7280',
    '--accent':'#16a34a','--accent-hover':'#22c55e','--accent-glow':'rgba(22,163,74,0.16)','--accent-rgb':'22,163,74',
    '--msg-user-bg':'#16a34a','--msg-agent-bg':'#ffffff',
    '--msg-user-text':'#ffffff','--msg-agent-text':'#111827',
    '--stream-dot':'#ffffff',
    '--brand-warm':'#15803d','--brand-warm-rgb':'21,128,61',
  },
}

const DEFAULT_THEME = 'light'
const THEMES = ['light', 'dark']

function applyThemeVars(theme) {
  const vars = THEME_VARS[theme] || THEME_VARS[DEFAULT_THEME]
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

export function useTheme() {
  const { state, dispatch } = useApp()

  const applyTheme = useCallback(
    (theme) => {
      const t = THEME_VARS[theme] ? theme : DEFAULT_THEME
      applyThemeVars(t)
      dispatch({ type: 'SET_THEME', payload: t })
      try { localStorage.setItem('riva-theme', t) } catch {}
    },
    [dispatch]
  )

  // Apply saved theme on mount (no flash)
  useEffect(() => {
    let saved = DEFAULT_THEME
    try { saved = localStorage.getItem('riva-theme') || DEFAULT_THEME } catch {}
    applyTheme(saved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cycleTheme = useCallback(() => {
    const idx = THEMES.indexOf(state.theme)
    const next = THEMES[(idx + 1) % THEMES.length]
    applyTheme(next)
  }, [state.theme, applyTheme])

  return { theme: state.theme, cycleTheme }
}
