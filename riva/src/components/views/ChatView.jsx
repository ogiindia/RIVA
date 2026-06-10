import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Download, Trash2 } from 'lucide-react'

import { useApp } from '../../context/AppContext'
import { useRivaChat } from '../../hooks/useRivaChat'
import { formatText, htmlToPlainText } from '../../utils/formatText'
import { parsePriorityFromReport } from '../../utils/parsePriority'

import { MessageBubble } from '../chat/MessageBubble'
import ChatInput from '../chat/ChatInput'
import SuggestionPills from '../chat/SuggestionPills'

import fisWhiteLogo from '../../assets/FISWhite.png'
import fisGreenLogo from '../../assets/FISGreen.png'

export default function ChatView() {
  const { state, dispatch } = useApp()
  const { currentCaseId: caseId, userId, alertPriorityMap, theme, chatResetToken } = state
  const backgroundLogo = theme === 'light' ? fisGreenLogo : fisWhiteLogo

  const [inputValue, setInputValue] = useState('')
  const [investigationDone, setInvestigationDone] = useState(false)

  const messagesEndRef = useRef(null)
  const chatInputRef   = useRef(null)
  const initDoneRef    = useRef(false) // guard against double-init in StrictMode

  // ── Priority callback ──────────────────────────────────────────────────
  const handlePriorityChange = useCallback(
    (priority) => dispatch({ type: 'SET_ALERT_PRIORITY', caseId, value: priority }),
    [caseId, dispatch]
  )

  // ── useRivaChat hook ───────────────────────────────────────────────────
  const {
    messages,
    isStreaming,
    streamPhase,
    suggestions,
    loadHistory,
    runInvestigation,
    sendMessage,
    stopStream,
    reset,
  } = useRivaChat({ userId, caseId, onPriorityChange: handlePriorityChange })

  // ── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Init: load history or start investigation ──────────────────────────
  useEffect(() => {
    if (!caseId || !userId) return

    let cancelled = false
    initDoneRef.current = false

    reset()
    setInvestigationDone(false)
    setInputValue('')

    async function init() {
      // Small delay to let StrictMode's second invocation cancel the first
      await new Promise((r) => setTimeout(r, 50))
      if (cancelled) return

      try {
        const history = await loadHistory()
        if (cancelled) return

        if (history.length > 0) {
          const hasAssistant = history.some((m) => m.role === 'assistant')
          setInvestigationDone(hasAssistant)
          return
        }
      } catch {
        // No history or error — fall through to investigation
      }

      if (cancelled || initDoneRef.current) return
      initDoneRef.current = true

      try {
        await runInvestigation()
        if (!cancelled) setInvestigationDone(true)
      } catch (err) {
        if (!cancelled) toast.error(`Investigation failed: ${err.message}`)
      }
    }

    init()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, userId])

  // ── Sidebar-triggered reset (chatResetToken increments) ────────────────
  useEffect(() => {
    if (chatResetToken === 0 || !caseId || !userId) return

    reset()
    setInvestigationDone(false)
    setInputValue('')
    initDoneRef.current = true

    runInvestigation()
      .then(() => setInvestigationDone(true))
      .catch((err) => toast.error(`Re-investigation failed: ${err.message}`))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatResetToken])

  // ── Send chat message ──────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text) => {
      try {
        await sendMessage(text)
      } catch (err) {
        toast.error(err.message)
      }
    },
    [sendMessage]
  )

  // ── Suggestion pill select ─────────────────────────────────────────────
  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      setInputValue(suggestion)
      requestAnimationFrame(() => chatInputRef.current?.focus())
    },
    []
  )

  // ── Download chat as plain text ────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const sep = '\n\n' + '─'.repeat(50) + '\n\n'
    const content = messages
      .filter((m) => m.content?.trim())
      .map((m) => {
        const label = m.role === 'user' ? 'Analyst' : 'RIVA'
        const tag   = m.source === 'investigate' ? ' [Investigation Report]' : ''
        const text  = m.role === 'user' ? m.content : htmlToPlainText(formatText(m.content))
        return `[${label}]${tag}\n${text}`
      })
      .join(sep)

    if (!content) { toast.error('Nothing to download yet'); return }

    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `riva-case-${caseId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [caseId, messages])

  // ── Reset / re-investigate ─────────────────────────────────────────────
  const handleReinvestigate = useCallback(() => {
    reset()
    setInvestigationDone(false)
    initDoneRef.current = true
    runInvestigation()
      .then(() => setInvestigationDone(true))
      .catch((err) => toast.error(`Re-investigation failed: ${err.message}`))
  }, [reset, runInvestigation])

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="view-active view-chat-layout"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}
    >
      {/* Background logo watermark */}
      <img src={backgroundLogo} alt="" aria-hidden="true" className="chat-bg-logo" />

      {/* Top meta bar */}
      <div className="chat-meta-bar">
        {investigationDone && (
          <button
            className="btn-icon"
            onClick={handleDownload}
            title="Download chat as text"
            aria-label="Download chat"
            style={{ marginLeft: 'auto' }}
          >
            <Download size={14} />
          </button>
        )}

        <button
          className="btn-icon"
          onClick={handleReinvestigate}
          disabled={isStreaming}
          title="Clear and re-investigate"
          aria-label="Re-investigate"
          style={{ marginLeft: investigationDone ? '0' : 'auto' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Message list */}
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Investigation messages"
      >
        {messages.map((msg) => {
          const msgIsStreaming =
            isStreaming && (msg.id === '__streaming__' || msg.content === '')

          return (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              source={msg.source}
              isStreaming={msgIsStreaming}
              streamPhase={streamPhase}
            />
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion pills */}
      <SuggestionPills suggestions={suggestions} onSelect={handleSuggestionSelect} />

      {/* Chat input */}
      <ChatInput
        value={inputValue}
        onValueChange={setInputValue}
        inputRef={chatInputRef}
        onSend={handleSend}
        disabled={isStreaming}
        placeholder={investigationDone ? 'Ask a follow-up question…' : 'Investigating…'}
      />
    </div>
  )
}
