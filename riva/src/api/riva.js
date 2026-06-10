/**
 * riva.js — API client for the RIVA Java backend (Spring Boot :8080).
 *
 * All requests go through the Vite proxy `/riva/**` → `http://localhost:8080`,
 * so there are no CORS issues in development.
 */

const RIVA_PREFIX = '/riva'

// ── Internal helpers ───────────────────────────────────────────────────────

async function rivaFetch(path, opts = {}) {
  const { headers, ...rest } = opts
  return fetch(`${RIVA_PREFIX}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  })
}

async function parseError(res) {
  let message = `RIVA error ${res.status}`
  try {
    const body = await res.json()
    if (body?.message) message = body.message
  } catch { /* ignore */ }
  return Object.assign(new Error(message), { status: res.status })
}

// ── Session ────────────────────────────────────────────────────────────────

/**
 * POST /api/sessions  { userId }
 * Ensures a session exists on the Java backend for this user.
 * Returns { sessionId, userId }
 */
export async function createRivaSession(userId) {
  const res = await rivaFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

// ── Chat history ───────────────────────────────────────────────────────────

/**
 * GET /api/chat/{caseId}/messages?userId=
 * Returns messages adapted to the frontend shape:
 *   [{ id, role: 'user'|'assistant', content, source, createdAt }]
 */
export async function getRivaChatHistory(caseId, userId) {
  const res = await rivaFetch(
    `/api/chat/${encodeURIComponent(caseId)}/messages?userId=${encodeURIComponent(userId)}`
  )
  if (!res.ok) throw await parseError(res)
  const data = await res.json()

  // Adapt Java shape → frontend shape
  // Java: { caseId, messages: [{id, role:'USER'|'ASSISTANT', content, status, createdAt}] }
  const msgs = Array.isArray(data.messages) ? data.messages : []

  // Find the first ASSISTANT message — treat it as the investigation report
  let firstAssistant = true
  return msgs.map((m) => {
    const role = m.role === 'USER' ? 'user' : 'assistant'
    let source = role === 'user' ? 'chat' : 'chat'
    if (role === 'assistant' && firstAssistant) {
      source = 'investigate'
      firstAssistant = false
    }
    return { id: m.id, role, content: m.content, source, createdAt: m.createdAt }
  })
}

// ── Streaming chat ─────────────────────────────────────────────────────────

/**
 * POST /api/chat/messages — streams the AI response as Server-Sent Events.
 *
 * Java emits SSE lines:
 *   data:token text\n
 *   data:\n
 *
 * Callbacks:
 *   onChunk(token, accumulated) — called per SSE data line
 *   onDone(accumulated)         — called when stream ends cleanly
 *   onError(err)                — called on network / server error
 *
 * Returns an abort function () => void.
 */
export function streamRivaChat({ userId, caseId, message }, onChunk, onDone, onError) {
  const controller = new AbortController()

  ;(async () => {
    let res
    try {
      res = await rivaFetch('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ userId, caseId, message }),
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
      })
    } catch (err) {
      if (err.name !== 'AbortError') onError(err)
      return
    }

    if (!res.ok) {
      onError(await parseError(res))
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let accumulated = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const token = line.slice(5) // strip "data:" prefix
            accumulated += token
            onChunk(token, accumulated)
          }
        }
      }

      // Flush any remaining buffer
      if (buffer.startsWith('data:')) {
        const token = buffer.slice(5)
        accumulated += token
        onChunk(token, accumulated)
      }

      onDone(accumulated)
    } catch (err) {
      if (err.name !== 'AbortError') onError(err)
    } finally {
      reader.cancel().catch(() => {})
    }
  })()

  return () => controller.abort()
}

// ── Health ─────────────────────────────────────────────────────────────────

/**
 * GET /actuator/health
 * Returns true if backend is reachable and UP.
 */
export async function checkRivaHealth() {
  try {
    const res = await rivaFetch('/actuator/health', { method: 'GET' })
    if (!res.ok) return false
    const data = await res.json()
    return data?.status === 'UP'
  } catch {
    return false
  }
}
