// Frontend/src/components/chat/RuleSuggestion.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Star, RotateCcw, Edit3, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { getRule, generateRule, updateRule } from '../../api/client'

function RuleBlock({ id, label, value, editable = false, onChange }) {
  const taRef = useRef(null)

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  if (!value && !editable) return null

  return (
    <div className="sr-block">
      <div className="sr-label">{label}</div>
      <textarea
        id={id}
        ref={taRef}
        className={`sr-textarea${editable ? ' sr-textarea-editing' : ''}`}
        readOnly={!editable}
        spellCheck={false}
        value={value ?? ''}
        onChange={editable ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  )
}

export default function RuleSuggestion({ isOpen, onClose }) {
  const { state } = useApp()
  const { currentAlertId: alertId } = state

  // phase: 'loading' | 'idle' | 'editing' | 'generating' | 'saving' | 'error'
  const [phase, setPhase] = useState('loading')
  const [ruleData, setRuleData] = useState(null)
  const [editText, setEditText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingLabel, setLoadingLabel] = useState('Checking for existing rule…')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const runGenerate = useCallback(async () => {
    setPhase('generating')
    setLoadingLabel('Generating suggested rule…')
    setErrorMsg('')
    try {
      const rd = await generateRule(alertId)
      if (!mountedRef.current) return
      setRuleData(rd)
      setPhase('idle')
    } catch (err) {
      if (!mountedRef.current) return
      setErrorMsg(err.message || 'Unknown error')
      setPhase('error')
    }
  }, [alertId])

  useEffect(() => {
    if (!isOpen || !alertId) return
    let cancelled = false
    setPhase('loading')
    setLoadingLabel('Checking for existing rule…')
    setRuleData(null)
    setErrorMsg('')

    getRule(alertId)
      .then((rd) => {
        if (cancelled) return
        const hasAny = rd && Object.values(rd).some(v => (typeof v === 'string' ? v : Object.keys(v || {}).length))
        if (hasAny) {
          setRuleData(rd)
          setPhase('idle')
        } else {
          runGenerate()
        }
      })
      .catch(() => {
        if (!cancelled) runGenerate()
      })

    return () => { cancelled = true }
  }, [isOpen, alertId, runGenerate])

  const handleAskAgain = useCallback(() => { runGenerate() }, [runGenerate])

  const handleEdit = useCallback(() => {
    if (!ruleData) return
    setEditText(ruleData.new_rule || '')
    setPhase('editing')
  }, [ruleData])

  const handleCancelEdit = useCallback(() => {
    setEditText('')
    setPhase('idle')
  }, [])

  const handleSave = useCallback(async () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    setPhase('saving')
    try {
      await updateRule(alertId, trimmed)
      if (!mountedRef.current) return
      setRuleData((rd) => ({ ...(rd || {}), new_rule: trimmed }))
      setPhase('idle')
    } catch (err) {
      if (!mountedRef.current) return
      toast.error('Failed to save rule: ' + err.message)
      setPhase('editing')
    }
  }, [alertId, editText])

  const handleRegister = useCallback(() => {
    toast('Register Alert functionality is coming soon.')
  }, [])

  const isBusy = phase === 'loading' || phase === 'generating' || phase === 'saving'
  const isEditing = phase === 'editing'
  const isError = phase === 'error'

  const similarDetail = (ruleData?.similar_rules_detail && typeof ruleData.similar_rules_detail === 'object')
    ? ruleData.similar_rules_detail
    : {}

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
            className="suggest-rule-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Suggested Rule"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="suggest-rule-header">
              <span className="suggest-rule-title">
                <Star size={15} />
                Suggested Rule
              </span>
              <button className="suggest-rule-close-btn" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="suggest-rule-body" id="suggest-rule-body">
              {isBusy ? (
                <div className="suggest-rule-loading">
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{loadingLabel}</span>
                </div>
              ) : isError ? (
                <p className="suggest-rule-error">Failed to generate rule: {errorMsg}</p>
              ) : ruleData ? (
                <div className="sr-section">
                  <RuleBlock
                    id="sr-actual-rule"
                    label={ruleData.actual_rule_name ? `Current Rule — ${ruleData.actual_rule_name}` : 'Current Rule'}
                    value={ruleData.actual_rule_content}
                  />
                  <RuleBlock
                    id="sr-new-rule"
                    label="Suggested New Rule"
                    value={isEditing ? editText : ruleData.new_rule}
                    editable={isEditing}
                    onChange={setEditText}
                  />
                  <RuleBlock id="sr-reason" label="Reason" value={ruleData.reason} />
                  <RuleBlock id="sr-threshold-change" label="Threshold Change" value={ruleData.threshold_change} />
                  <RuleBlock id="sr-similarity" label="Similarity Analysis" value={ruleData.similarity_result} />
                  {Object.keys(similarDetail).map((name) => (
                    <RuleBlock
                      key={name}
                      id={`sr-similar-${name.replace(/\W/g, '_')}`}
                      label={`Similar Rule — ${name}`}
                      value={similarDetail[name]}
                    />
                  ))}
                  <RuleBlock id="sr-duplicate" label="Duplicate Recommendation" value={ruleData.duplicate_recommendation} />
                  <RuleBlock id="sr-disclaimer" label="Disclaimer" value={ruleData.disclaimer} />

                  {isEditing && (
                    <div className="suggest-rule-edit-actions">
                      <button
                        className="btn-suggest-save"
                        onClick={handleSave}
                        disabled={phase === 'saving'}
                      >
                        {phase === 'saving' ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="btn-suggest-cancel-edit"
                        onClick={handleCancelEdit}
                        disabled={phase === 'saving'}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="suggest-rule-footer">
              <button
                className="btn-suggest-ask-again"
                onClick={handleAskAgain}
                disabled={isBusy || isEditing}
              >
                <RotateCcw size={13} />
                Ask Again
              </button>
              <button
                className="btn-suggest-edit"
                onClick={handleEdit}
                disabled={isBusy || isEditing || !ruleData?.new_rule}
              >
                <Edit3 size={13} />
                Edit
              </button>
              <button
                className="btn-suggest-register"
                onClick={handleRegister}
                title="Coming soon — not yet functional"
              >
                <CheckCircle2 size={13} />
                Register Alert
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
