// Frontend/src/components/chat/ExternalListModal.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Database, ChevronLeft, Loader2, CheckCircle2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import {
  listExternalTables,
  getExternalTableSchema,
  insertExternalRow,
} from '../../api/client'

function inputTypeFor(col) {
  switch (col.input_kind) {
    case 'int':      return 'number'
    case 'decimal':  return 'number'
    case 'date':     return 'date'
    case 'datetime': return 'datetime-local'
    case 'time':     return 'time'
    default:         return 'text'
  }
}

function stepFor(col) {
  if (col.input_kind === 'int') return '1'
  if (col.input_kind === 'decimal') {
    const scale = col.numeric_scale ?? 0
    return scale > 0 ? `0.${'0'.repeat(scale - 1)}1` : '1'
  }
  return undefined
}

function ColumnField({ col, value, onChange, disabled }) {
  const required = !col.is_nullable && !col.has_default
  const isBool = col.input_kind === 'bool'

  let hint = col.data_type
  if (col.max_length) hint += `(${col.max_length})`
  else if (col.numeric_precision) {
    hint += `(${col.numeric_precision}${col.numeric_scale ? `,${col.numeric_scale}` : ''})`
  }
  if (!required) hint += ' · optional'

  if (isBool) {
    return (
      <label className="ext-field ext-field-bool">
        <input
          type="checkbox"
          checked={value === true || value === 'true' || value === 1}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="ext-field-label">
          {col.name} <span className="ext-field-hint">{hint}</span>
        </span>
      </label>
    )
  }

  return (
    <label className="ext-field">
      <span className="ext-field-label">
        {col.name}
        {required && <span className="ext-field-required"> *</span>}
        <span className="ext-field-hint">{hint}</span>
      </span>
      <input
        className="ext-field-input"
        type={inputTypeFor(col)}
        step={stepFor(col)}
        maxLength={col.input_kind === 'string' ? (col.max_length || undefined) : undefined}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={col.input_kind === 'string' && col.max_length ? `max ${col.max_length} chars` : ''}
      />
    </label>
  )
}

export default function ExternalListModal({ isOpen, onClose, onInserted }) {
  const { state } = useApp()
  const { currentAlertId: alertId } = state

  const [phase, setPhase] = useState('loading-tables')
  const [errorMsg, setErrorMsg] = useState('')
  const [tables, setTables] = useState([])
  const [dbType, setDbType] = useState('')
  const [selectedTable, setSelectedTable] = useState(null)
  const [columns, setColumns] = useState([])
  const [values, setValues] = useState({})
  const [search, setSearch] = useState('')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Load tables when modal opens
  useEffect(() => {
    if (!isOpen) return
    setPhase('loading-tables')
    setErrorMsg('')
    setSelectedTable(null)
    setColumns([])
    setValues({})
    setSearch('')

    listExternalTables()
      .then((data) => {
        if (!mountedRef.current) return
        setTables(data.tables || [])
        setDbType(data.db_type || '')
        setPhase('picking')
      })
      .catch((err) => {
        if (!mountedRef.current) return
        setErrorMsg(err.message)
        setPhase('error')
      })
  }, [isOpen])

  const pickTable = useCallback(async (tableName) => {
    setPhase('loading-schema')
    setErrorMsg('')
    setSelectedTable(tableName)
    try {
      const data = await getExternalTableSchema(tableName)
      if (!mountedRef.current) return
      const cols = (data.columns || []).filter(c => !c.is_auto)
      setColumns(cols)
      const initial = {}
      cols.forEach(c => {
        initial[c.name] = c.input_kind === 'bool' ? false : ''
      })
      setValues(initial)
      setPhase('filling')
    } catch (err) {
      if (!mountedRef.current) return
      setErrorMsg(err.message)
      setPhase('error')
    }
  }, [])

  const backToList = useCallback(() => {
    setSelectedTable(null)
    setColumns([])
    setValues({})
    setPhase('picking')
    setErrorMsg('')
  }, [])

  const handleChange = useCallback((name, val) => {
    setValues(prev => ({ ...prev, [name]: val }))
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!alertId || !selectedTable) return

    // Strip empty strings so the backend treats them as missing (column defaults / NULL).
    const payload = {}
    for (const col of columns) {
      const v = values[col.name]
      if (col.input_kind === 'bool') {
        payload[col.name] = !!v
      } else if (typeof v === 'string' && v.trim() === '') {
        // skip
      } else if (v !== null && v !== undefined) {
        payload[col.name] = v
      }
    }

    setPhase('submitting')
    setErrorMsg('')
    try {
      await insertExternalRow(selectedTable, alertId, payload)
      if (!mountedRef.current) return
      toast.success(`Added to ${selectedTable}`)
      setPhase('done')
      onInserted?.()
    } catch (err) {
      if (!mountedRef.current) return
      setErrorMsg(err.message)
      setPhase('filling')
      toast.error(err.message)
    }
  }, [alertId, selectedTable, columns, values, onInserted])

  const isBusy = phase === 'loading-tables' || phase === 'loading-schema' || phase === 'submitting'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="suggest-rule-overlay visible"
          aria-hidden="true"
          style={{ display: 'flex' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="suggest-rule-modal ext-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add to external list"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="suggest-rule-header">
              <span className="suggest-rule-title">
                {selectedTable && phase !== 'done' && (
                  <button
                    className="ext-back-btn"
                    onClick={backToList}
                    aria-label="Back to table list"
                    disabled={isBusy}
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <Database size={15} />
                {phase === 'done' ? 'Added to External List'
                  : selectedTable
                    ? selectedTable
                    : 'Add to External List'}
              </span>
              <button className="suggest-rule-close-btn" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="suggest-rule-body">
              {phase === 'loading-tables' && (
                <div className="suggest-rule-loading">
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading tables…</span>
                </div>
              )}

              {phase === 'loading-schema' && (
                <div className="suggest-rule-loading">
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading schema for {selectedTable}…</span>
                </div>
              )}

              {phase === 'error' && (
                <p className="suggest-rule-error">Error: {errorMsg}</p>
              )}

              {phase === 'picking' && (
                <>
                  {dbType && (
                    <div className="ext-dbtype-hint">
                      Database: <code>{dbType}</code> — {tables.length} table{tables.length === 1 ? '' : 's'}
                    </div>
                  )}

                  {tables.length > 0 && (
                    <div className="ext-search">
                      <Search size={14} className="ext-search-icon" />
                      <input
                        type="text"
                        className="ext-search-input"
                        placeholder="Search tables…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                      />
                      {search && (
                        <button
                          type="button"
                          className="ext-search-clear"
                          onClick={() => setSearch('')}
                          aria-label="Clear search"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {(() => {
                    if (tables.length === 0) {
                      return <p className="suggest-rule-error">No tables found.</p>
                    }
                    const q = search.trim().toLowerCase()
                    const filtered = q
                      ? tables.filter(t => t.name.toLowerCase().includes(q))
                      : tables
                    if (filtered.length === 0) {
                      return <p className="ext-empty-hint">No tables match “{search}”.</p>
                    }
                    return (
                      <ul className="ext-table-list">
                        {filtered.map((t) => (
                          <li key={`${t.schema}.${t.name}`}>
                            <button
                              className="ext-table-item"
                              onClick={() => pickTable(t.name)}
                            >
                              <Database size={13} />
                              <span>{t.name}</span>
                              {t.schema && <small>{t.schema}</small>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                </>
              )}

              {(phase === 'filling' || phase === 'submitting') && (
                <form className="ext-form" onSubmit={handleSubmit}>
                  {columns.length === 0 && (
                    <p className="suggest-rule-error">No editable columns.</p>
                  )}
                  {columns.map((col) => (
                    <ColumnField
                      key={col.name}
                      col={col}
                      value={values[col.name]}
                      onChange={(v) => handleChange(col.name, v)}
                      disabled={phase === 'submitting'}
                    />
                  ))}
                  {errorMsg && phase === 'filling' && (
                    <p className="suggest-rule-error">{errorMsg}</p>
                  )}
                  <div className="ext-form-actions">
                    <button
                      type="button"
                      className="btn-suggest-cancel-edit"
                      onClick={backToList}
                      disabled={phase === 'submitting'}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn-suggest-save"
                      disabled={phase === 'submitting' || columns.length === 0}
                    >
                      {phase === 'submitting' ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </form>
              )}

              {phase === 'done' && (
                <div className="ext-done">
                  <CheckCircle2 size={40} style={{ color: 'var(--success)' }} />
                  <p>
                    Row added to <strong>{selectedTable}</strong> for alert{' '}
                    <strong>{alertId}</strong>.
                  </p>
                  <button className="btn-suggest-save" onClick={onClose}>Close</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
