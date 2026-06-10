// Frontend/src/components/views/LandingView.jsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Shield, Activity, TrendingUp, Cpu, Bot, ShieldAlert, ScanSearch, BrainCircuit } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const EASE = [0.22, 1, 0.36, 1]

function NetworkCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const nodes = []
    const nodeCount = 35

    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
        type: Math.random() > 0.7 ? 'alert' : 'node',
      })
    }

    function draw() {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      const brandRgb = getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-warm-rgb').trim() || '249, 115, 22'

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.pulse += 0.02
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12
            ctx.strokeStyle = `rgba(${brandRgb}, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        const glow = Math.sin(n.pulse) * 0.3 + 0.7
        if (n.type === 'alert') {
          ctx.fillStyle = `rgba(${brandRgb}, ${glow * 0.6})`
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r + 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `rgba(253, 186, 116, ${glow})`
        } else {
          ctx.fillStyle = `rgba(${brandRgb}, ${glow * 0.55})`
        }
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="landing-network-canvas" />
}

const STAT_ITEMS = [
  // { icon: Shield, label: 'Fraud Detection', desc: 'AI-powered analysis' },
  // { icon: Activity, label: 'Transaction Monitor', desc: 'Real-time surveillance' },
  // { icon: TrendingUp, label: 'Risk Scoring', desc: 'Adaptive intelligence' },
  // { icon: Cpu, label: 'Deep Investigation', desc: 'Automated copilot' },
]

export default function LandingView() {
  const { state, dispatch } = useApp()
  const { userId } = state
  const [alertId, setAlertId] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleAlertIdChange = useCallback((e) => setAlertId(e.target.value), [])

  const handleInvestigate = useCallback(() => {
    const trimmed = alertId.trim()
    if (!trimmed) return

    // Accept a bare Case ID or extract one from natural language
    // e.g. "Analyse this case d99c9cc0-7f4a-4318-aaa4-b3bc2f618337"
    const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const uuidMatch = trimmed.match(UUID_RE)
    const caseId = uuidMatch ? uuidMatch[0] : trimmed

    dispatch({ type: 'SHOW_CHAT', caseId })
  }, [alertId, dispatch])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInvestigate()
    }
  }, [handleInvestigate])

  return (
    <div className="landing-root">
      <NetworkCanvas />

      <div className="landing-content">
        <motion.div
          className="landing-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <motion.div
            className="landing-logo-ring"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          >
            <div className="landing-logo-inner">
              <Bot size={28} />
            </div>
            <div className="landing-logo-orbit" />

            
          </motion.div>

          <motion.h1
            className="landing-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            RIVA
          </motion.h1>

          {/* <motion.p
            className="landing-tagline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
          >
            Risk Investigator Virtual Assistant
          </motion.p> */}

          <motion.div
            className="landing-icon-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
          >
            <span className="landing-icon-chip" title="Risk">
              <ShieldAlert size={14} />
              <span>Risk</span>
            </span>
            <span className="landing-icon-chip" title="Investigator">
              <ScanSearch size={14} />
              <span>Investigator</span>
            </span>
            <span className="landing-icon-chip" title="Virtual Assistant">
              <BrainCircuit size={14} />
              <span>Virtual Assistant</span>
            </span>
          </motion.div>

          <motion.p
            className="landing-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            AI-driven case investigation for banking & financial services
          </motion.p>

          {userId && (
            <motion.span
              className="landing-user-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              {userId}
            </motion.span>
          )}
        </motion.div>

        <motion.div
          className={`landing-search-card ${isFocused ? 'focused' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
        >
          <div className="landing-search-header">
            <Shield size={16} className="landing-search-icon" />
            <span>Investigate Case</span>
          </div>
          <div className="landing-search-body">
            <div className="landing-input-wrap">
              <Search size={18} className="landing-input-icon" />
              <input
                type="text"
                className="landing-input"
                aria-label="Alert number"
                placeholder="Enter Case ID or paste a message containing it…"
                value={alertId}
                onChange={handleAlertIdChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                className="landing-btn"
                onClick={handleInvestigate}
                disabled={!alertId.trim()}
              >
                {/* <span></span> */}
                <Search size={14} />
              </button>
            </div>
            <p className="landing-hint">
              Enter a Case ID, or paste any message containing one — RIVA will extract it
            </p>
          </div>
        </motion.div>

        <motion.div
          className="landing-stats"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
        >
          {STAT_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              className="landing-stat-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 + i * 0.08, ease: EASE }}
            >
              <item.icon size={18} className="landing-stat-icon" />
              <div>
                <div className="landing-stat-label">{item.label}</div>
                <div className="landing-stat-desc">{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="landing-scan-line" />
    </div>
  )
}
