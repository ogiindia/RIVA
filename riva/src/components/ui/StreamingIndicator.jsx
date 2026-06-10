import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const THINKING_PHASES = [
  { text: 'Thinking...', delay: 0 },
  { text: 'Almost ready...', delay: 4000 },
  { text: 'Here we go...', delay: 7000 },
]

export function StreamingIndicator({ phase }) {
  const [thinkingLabel, setThinkingLabel] = useState('Thinking...')

  useEffect(() => {
    if (phase !== 'thinking') {
      setThinkingLabel('Thinking...')
      return
    }
    const timers = THINKING_PHASES.slice(1).map(({ text, delay }) =>
      setTimeout(() => setThinkingLabel(text), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [phase])

  if (phase === 'hidden') return null

  const label = phase === 'writing' ? 'Writing...' : thinkingLabel

  return (
    <div className="chat-stream-status">
      <motion.span
        className="pulse-dot"
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
      <span className="chat-stream-status-text">{label}</span>
    </div>
  )
}
