// Frontend/src/components/chat/MessageBubble.jsx
import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatText, getStreamDisplayHtml, htmlToPlainText } from '../../utils/formatText'
import { StreamingIndicator } from '../ui/StreamingIndicator'
import { useApp } from '../../context/AppContext'
import { getInitials } from '../../utils/initials'

const BUBBLE_INITIAL = { opacity: 0, y: 8 }
const BUBBLE_ANIMATE = { opacity: 1, y: 0 }
const BUBBLE_TRANSITION = { duration: 0.25, ease: [0.22, 1, 0.36, 1] }

/**
 * MessageBubble — renders a single chat message bubble.
 *
 * Props:
 *   role        — 'user' | 'assistant'
 *   content     — raw text string
 *   source      — 'investigate' | 'chat' | undefined (shows source tag when 'investigate')
 *   isStreaming — boolean, true while the message is still being written
 *   streamPhase — 'thinking' | 'writing' | 'hidden' (only relevant when isStreaming)
 *   footer      — optional node rendered inside the bubble, below the text (e.g. close-alert-bar)
 *   onRetry     — optional function, only used for user messages
 */
export function MessageBubble({ role, content, source, isStreaming, streamPhase, footer, onRetry }) {
  const isUser = role === 'user'
  const { state } = useApp()

  const assistantHtml = isStreaming
    ? getStreamDisplayHtml(content)
    : formatText(content)

  const handleCopy = useCallback(() => {
    const plain = htmlToPlainText(assistantHtml)
    navigator.clipboard.writeText(plain)
      .then(() => toast.success('Copied!'))
      .catch(() => toast.error('Copy failed'))
  }, [assistantHtml])

  return (
    <motion.div
      className={`chat-msg ${isUser ? 'chat-msg-user' : ''}`}
      initial={BUBBLE_INITIAL}
      animate={BUBBLE_ANIMATE}
      transition={BUBBLE_TRANSITION}
    >
      {/* Avatar */}
      <div className={`chat-avatar ${isUser ? 'chat-avatar-user' : 'chat-avatar-assistant'}`}>
        {isUser ? getInitials(state.userId) : 'RI'}
      </div>

      {/* Bubble */}
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        {isUser ? (
          /* ── User bubble: plain text ── */
          <>
            <p className="chat-text">{content}</p>
            {onRetry && (
              <div className="msg-actions">
                <button
                  className="chat-retry-btn"
                  onClick={onRetry}
                  aria-label="Retry this message"
                >
                  <RotateCcw size={11} />
                  Retry
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── Assistant bubble: rendered HTML ── */
          <>
            {source === 'investigate' && (
              <span className="chat-source-tag">Investigation Report</span>
            )}

            {isStreaming && (
              <StreamingIndicator phase={streamPhase} />
            )}

            <div
              className="chat-text"
              dangerouslySetInnerHTML={{ __html: assistantHtml }}
            />

            <div className={`msg-actions ${isStreaming ? 'msg-actions-hidden' : ''}`}>
              <button
                className="msg-copy-btn"
                onClick={handleCopy}
                aria-label="Copy message"
              >
                <Copy size={12} />
                Copy
              </button>
            </div>

            {!isStreaming && footer}
          </>
        )}
      </div>
    </motion.div>
  )
}
