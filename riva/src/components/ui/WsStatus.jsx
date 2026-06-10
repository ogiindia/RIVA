// Frontend/src/components/ui/WsStatus.jsx
import { motion } from 'framer-motion'

const STATUS_LABEL = {
  connected:       'Connected',
  disconnected:    'Disconnected — reconnecting...',
  connecting:      'Connecting...',
  session_invalid: 'Session invalid — please reload',
}

export function WsStatus({ status }) {
  const isConnected = status === 'connected'
  return (
    <div className="ws-status">
      <motion.span
        className={`ws-dot ${isConnected ? 'connected' : 'disconnected'}`}
        animate={{ opacity: isConnected ? 1 : [1, 0.3, 1] }}
        transition={{ repeat: isConnected ? 0 : Infinity, duration: 1.5 }}
      />
      <span>{STATUS_LABEL[status] || 'Connecting...'}</span>
    </div>
  )
}
