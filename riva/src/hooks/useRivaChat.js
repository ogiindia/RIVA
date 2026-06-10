/**
 * useRivaChat.js — Chat lifecycle hook backed by the RIVA Java backend.
 *
 * Manages:
 *  - Loading chat history for a case
 *  - Streaming investigation / chat messages
 *  - Streaming state (phase: 'thinking' | 'writing' | 'hidden')
 *  - Abort on unmount / case change
 */

import { useState, useCallback, useRef } from 'react'
import { getRivaChatHistory, streamRivaChat } from '../api/riva'
import { parseSuggestions } from '../utils/parseSuggestions'
import { parsePriorityFromReport } from '../utils/parsePriority'

function genId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const STREAMING_ID = '__streaming__'

export function useRivaChat({ userId, caseId, onPriorityChange }) {
  const [messages, setMessages] = useState([])
  const [streamPhase, setStreamPhase] = useState('hidden') // 'thinking'|'writing'|'hidden'
  const [isStreaming, setIsStreaming] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const abortRef = useRef(null)

  // ── Internal: run one stream call ────────────────────────────────────────
  const _stream = useCallback(
    (message, source) =>
      new Promise((resolve, reject) => {
        // Add placeholder assistant bubble
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', id: STREAMING_ID, source },
        ])
        setStreamPhase('thinking')
        setIsStreaming(true)

        let phaseRef = 'thinking'

        const abort = streamRivaChat(
          { userId, caseId, message },
          // onChunk
          (_token, accumulated) => {
            if (phaseRef === 'thinking' && accumulated.length > 0) {
              phaseRef = 'writing'
              setStreamPhase('writing')
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_ID ? { ...m, content: accumulated } : m
              )
            )
          },
          // onDone
          (accumulated) => {
            const { cleanText, suggestions: newSuggestions } = parseSuggestions(accumulated)
            setSuggestions(newSuggestions)

            const priority = parsePriorityFromReport(cleanText)
            onPriorityChange?.(priority)

            const finalId = genId()
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_ID ? { ...m, content: cleanText, id: finalId } : m
              )
            )
            setIsStreaming(false)
            setStreamPhase('hidden')
            resolve(cleanText)
          },
          // onError
          (err) => {
            if (err.name === 'AbortError') return
            // Remove empty placeholder
            setMessages((prev) => prev.filter((m) => m.id !== STREAMING_ID))
            setIsStreaming(false)
            setStreamPhase('hidden')
            reject(err)
          }
        )

        abortRef.current = abort
      }),
    [userId, caseId, onPriorityChange]
  )

  // ── Load history from Java backend ────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    const msgs = await getRivaChatHistory(caseId, userId)
    if (msgs.length > 0) {
      setMessages(msgs)

      // Derive priority from first assistant message (investigation report)
      const investigationMsg = msgs.find(
        (m) => m.role === 'assistant' && m.source === 'investigate'
      )
      if (investigationMsg?.content) {
        const priority = parsePriorityFromReport(investigationMsg.content)
        onPriorityChange?.(priority)
      }
    }
    return msgs
  }, [caseId, userId, onPriorityChange])

  // ── Run investigation (first message) ─────────────────────────────────────
  const runInvestigation = useCallback(async () => {
    return _stream('Analyze this case', 'investigate')
  }, [_stream])

  // ── Send follow-up chat message ───────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      if (isStreaming) return

      setSuggestions([])

      // Append user message immediately
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text, id: genId(), source: 'chat' },
      ])

      return _stream(text, 'chat')
    },
    [isStreaming, _stream]
  )

  // ── Abort active stream ───────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    // Mark interrupted message as done
    setMessages((prev) =>
      prev.map((m) => (m.id === STREAMING_ID ? { ...m, id: genId() } : m))
    )
    setIsStreaming(false)
    setStreamPhase('hidden')
  }, [])

  // ── Reset all state (e.g. on case change) ─────────────────────────────────
  const reset = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    setMessages([])
    setSuggestions([])
    setIsStreaming(false)
    setStreamPhase('hidden')
  }, [])

  return {
    messages,
    isStreaming,
    streamPhase,
    suggestions,
    loadHistory,
    runInvestigation,
    sendMessage,
    stopStream,
    reset,
  }
}
