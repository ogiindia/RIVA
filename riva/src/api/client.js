// Frontend/src/api/client.js

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')
const u = (path) => `${API_BASE}${path}`

// ── CSRF token — set once after session init, attached to every request ──────
let _csrf = ''
let _username = ''
let _reauthInFlight = null

export function setCsrfToken(token) { _csrf = token || '' }
export function getCsrfToken() { return _csrf }
export function setUsername(name) { _username = name || '' }

function buildHeaders(extra) {
  const merged = { ...(extra || {}) }
  if (_csrf && !merged['X-CSRF-Token'] && !merged['x-csrf-token']) {
    merged['X-CSRF-Token'] = _csrf
  }
  return merged
}

/**
 * Wrapper around fetch() that:
 *  - prefixes the URL with API_BASE (for direct-to-backend builds)
 *  - always sends credentials (cookies)
 *  - always injects X-CSRF-Token when we have one
 *  - on 401 (stale session / backend restart), auto-reauths and retries ONCE
 */
async function apiFetch(path, opts = {}, _isRetry = false) {
  const { headers, ...rest } = opts
  const resp = await fetch(u(path), {
    credentials: 'include',
    ...rest,
    headers: buildHeaders(headers),
  })

  // Auto-recover from stale session — skip for the session endpoint itself
  if (resp.status === 401 && !_isRetry && _username && !path.startsWith('/api/session')) {
    try {
      if (!_reauthInFlight) _reauthInFlight = fetchSession(_username).finally(() => { _reauthInFlight = null })
      await _reauthInFlight
      return apiFetch(path, opts, true)
    } catch {
      return resp // give up; let caller handle 401
    }
  }
  return resp
}

// ── Session bootstrap ────────────────────────────────────────────────────────

/**
 * Bootstrap the session. GET /api/session?username=<username> sets the
 * signed inv_session cookie and returns { username, csrf_token, app_name }.
 */
export async function fetchSession(username) {
  const resp = await apiFetch(`/api/session?username=${encodeURIComponent(username)}`)
  if (!resp.ok) {
    throw Object.assign(new Error(`Session init failed: ${resp.status}`), { status: resp.status })
  }
  const data = await resp.json()
  if (!data?.csrf_token) throw new Error('CSRF token missing in session response')
  setCsrfToken(data.csrf_token)
  return data.csrf_token
}

// ── Streaming endpoints ──────────────────────────────────────────────────────

/** POST /api/investigate — streaming */
export async function streamInvestigate(alertId, _csrfUnused, signal, onChunk) {
  return _stream('/api/investigate', { alert_number: alertId }, signal, onChunk)
}

/** POST /api/chat — streaming */
export async function streamChat(alertId, message, _csrfUnused, signal, onChunk) {
  return _stream('/api/chat', { alert_number: alertId, message }, signal, onChunk)
}

async function _stream(path, body, signal, onChunk) {
  const resp = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (resp.status === 401 || resp.status === 403) throw Object.assign(new Error('session'), { status: resp.status })
  if (!resp.ok) throw new Error(`Server responded with ${resp.status}`)

  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let collected = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      collected += chunk
      onChunk(chunk, collected)
    }
  } finally {
    reader.cancel().catch(() => {})
  }
  return collected
}

// ── Chat / alert endpoints ───────────────────────────────────────────────────

/**
 * Fetch chat history for an alert.
 * Returns the full payload: { alert_id, is_closed, messages: [{role,content,timestamp,source}] }
 */
export async function getChatHistory(alertId) {
  const resp = await apiFetch(`/api/chat-history/${encodeURIComponent(alertId)}`)
  if (!resp.ok) throw new Error(`Failed to load history: ${resp.status}`)
  return resp.json()
}

export async function getAlertList(offset = 0, limit = 20) {
  const resp = await apiFetch(`/api/chat-alerts?offset=${offset}&limit=${limit}`)
  if (!resp.ok) throw new Error(`Failed to load alerts: ${resp.status}`)
  return resp.json()
}

export async function closeAlert(alertId) {
  const resp = await apiFetch('/api/close-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_number: alertId }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.detail || `Server responded with ${resp.status}`)
  }
  return resp.json()
}

export async function getAlertStatus(alertId) {
  const resp = await apiFetch(`/api/alert-status/${encodeURIComponent(alertId)}`)
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`)
  return resp.json()
}

export async function deleteChatHistory(alertId) {
  const resp = await apiFetch(`/api/chat-history/${encodeURIComponent(alertId)}`, { method: 'DELETE' })
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`)
  return resp.json()
}

// ── Rule endpoints ───────────────────────────────────────────────────────────

// Returns the stored rule_data object, or null if no rule exists.
export async function getRule(alertId) {
  const resp = await apiFetch(`/api/suggest-rule/${encodeURIComponent(alertId)}`)
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`)
  const data = await resp.json()
  return data?.rule?.rule_data ?? null
}

// Generates and stores a new rule. Returns the rule_data object.
export async function generateRule(alertId) {
  const resp = await apiFetch(`/api/suggest-rule/${encodeURIComponent(alertId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`)
  const data = await resp.json()
  return data?.rule_data ?? {}
}

// Patches only the `new_rule` field. Backend handles the JSON merge.
export async function updateRule(alertId, newRuleText) {
  const resp = await apiFetch(`/api/suggest-rule/${encodeURIComponent(alertId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rule_text: newRuleText }),
  })
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`)
  return resp.json()
}

// ── Misc ─────────────────────────────────────────────────────────────────────

// NOTE: sendBeacon cannot set custom headers, so the CSRF token is passed as a
// query param. Backend accepts either header OR `?csrf=` for this one endpoint.
export function savePartialToServer(alertId, content, source, isComplete) {
  if (!content || !content.trim()) return
  const payload = JSON.stringify({ alert_number: alertId, content, source, is_complete: isComplete })
  const csrfQS = _csrf ? `?csrf=${encodeURIComponent(_csrf)}` : ''
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' })
    if (navigator.sendBeacon(u(`/api/save-partial${csrfQS}`), blob)) return
  }
  apiFetch('/api/save-partial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {})
}

/**
 * Step 1 of two-step PDF download: POST report content, receive a download_token.
 * Step 2: caller opens `/api/download-pdf?token=<token>` in a new tab.
 */
export async function downloadReport(alertId, reportContent) {
  const resp = await apiFetch('/api/download-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_number: alertId, report_content: reportContent }),
  })
  if (!resp.ok) throw new Error(`Server responded with ${resp.status}`)
  return resp.json()
}

// ── External List ────────────────────────────────────────────────────────────

export async function listExternalTables() {
  const resp = await apiFetch('/api/external-list/tables')
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.detail || `Failed: ${resp.status}`)
  }
  return resp.json()
}

export async function getExternalTableSchema(tableName) {
  const resp = await apiFetch(`/api/external-list/tables/${encodeURIComponent(tableName)}/schema`)
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.detail || `Failed: ${resp.status}`)
  }
  return resp.json()
}

export async function insertExternalRow(tableName, alertId, values) {
  const resp = await apiFetch(`/api/external-list/tables/${encodeURIComponent(tableName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_number: alertId, values }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.detail || `Failed: ${resp.status}`)
  }
  return resp.json()
}

export async function getExternalListStatus(alertId) {
  const resp = await apiFetch(`/api/external-list/status/${encodeURIComponent(alertId)}`)
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`)
  return resp.json()
}

export async function getPreference(key) {
  const resp = await apiFetch(`/api/preference/${key}`)
  if (!resp.ok) return null
  return resp.json()
}

export async function setPreference(key, value) {
  apiFetch(`/api/preference/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  }).catch(() => {})
}
