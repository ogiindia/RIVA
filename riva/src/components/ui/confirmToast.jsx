// Frontend/src/components/ui/confirmToast.jsx
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion } from 'framer-motion'

function ConfirmDialog({ message, yesLabel, noLabel, yesVariant, onResolve }) {
  const [visible, setVisible] = useState(false)

  const close = (val) => {
    setVisible(false)
    setTimeout(() => onResolve(val), 180)
  }

  useEffect(() => {
    setVisible(true)
    const onKey = (e) => {
      if (e.key === 'Escape') close(false)
      else if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="suggest-rule-overlay visible"
          aria-hidden="true"
          style={{ display: 'flex', zIndex: 1100 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => close(false)}
        >
          <motion.div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-message">{message}</div>
            <div className="confirm-modal-actions">
              <button
                className="confirm-toast-btn confirm-toast-btn-no"
                onClick={() => close(false)}
              >
                {noLabel}
              </button>
              <button
                className={`confirm-toast-btn confirm-toast-btn-yes${yesVariant === 'danger' ? ' confirm-toast-btn-danger' : ''}`}
                onClick={() => close(true)}
                autoFocus
              >
                {yesLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function confirmToast({
  message,
  yesLabel = 'Yes',
  noLabel = 'No',
  yesVariant = 'default',
}) {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    function handleResolve(val) {
      root.unmount()
      container.remove()
      resolve(val)
    }

    root.render(
      <ConfirmDialog
        message={message}
        yesLabel={yesLabel}
        noLabel={noLabel}
        yesVariant={yesVariant}
        onResolve={handleResolve}
      />
    )
  })
}
