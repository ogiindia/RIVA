import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const EXPANDED_WIDTH = 220
const COLLAPSED_WIDTH = 48

export default function Sidebar() {
  const { state, dispatch } = useApp()
  const { sidebarCollapsed, currentCaseId, recentCases } = state

  const handleToggle = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), [dispatch])

  const handleCaseClick = useCallback(
    (caseId) => dispatch({ type: 'SHOW_CHAT', caseId }),
    [dispatch]
  )

  const handleNewInvestigation = useCallback(
    () => dispatch({ type: 'SHOW_LANDING' }),
    [dispatch]
  )

  const handleRemoveCase = useCallback(
    (caseId, e) => {
      e.stopPropagation()
      dispatch({ type: 'REMOVE_CASE', caseId })
    },
    [dispatch]
  )

  return (
    <motion.div
      className="sidebar"
      animate={{ width: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden', flexShrink: 0 }}
    >
      {/* Header: brand + toggle */}
      <div className="sidebar-brand" style={{ justifyContent: sidebarCollapsed ? 'center' : undefined }}>
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.span
              className="brand-text"
              key="brand-text"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap', transformOrigin: 'left', display: 'inline-block' }}
            >
              Case History
            </motion.span>
          )}
        </AnimatePresence>

        <button
          className="btn-icon-tiny"
          onClick={handleToggle}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          style={{ flexShrink: 0, marginLeft: sidebarCollapsed ? 0 : 'auto' }}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* New Investigation button */}
      <div className="sidebar-new-investigation">
        <button
          type="button"
          className="nav-item nav-item-new"
          onClick={handleNewInvestigation}
          title="New Investigation"
          aria-label="New Investigation"
          style={{
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            justifyContent: sidebarCollapsed ? 'center' : undefined,
          }}
        >
          <Plus size={16} />
          {!sidebarCollapsed && <span>New Investigation</span>}
        </button>
      </div>

      {/* Case list — only when expanded */}
      <AnimatePresence initial={false}>
        {!sidebarCollapsed && (
          <motion.div
            key="sidebar-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}
          >
            <div className="sidebar-section-label">
              <span>Investigations</span>
            </div>

            <nav className="sidebar-nav">
              {recentCases.length === 0 && (
                <div className="sidebar-empty">No cases yet</div>
              )}

              {recentCases.map(({ caseId }) => {
                const isActive = caseId === currentCaseId
                return (
                  <div
                    key={caseId}
                    className={`sidebar-alert-row${isActive ? ' active' : ''}`}
                  >
                    <button
                      className={`nav-item sidebar-alert-item${isActive ? ' active' : ''}`}
                      onClick={() => handleCaseClick(caseId)}
                      title={caseId}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={caseId}
                      style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span className="sidebar-alert-text" style={{ flex: 1 }}>
                        {caseId}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="sidebar-alert-delete"
                      onClick={(e) => handleRemoveCase(caseId, e)}
                      aria-label={`Remove ${caseId} from history`}
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
