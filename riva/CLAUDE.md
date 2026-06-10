# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on :5173 (proxies /api and /ws to backend)
npm run build     # Production build to dist/
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

Node 22.18.0 and npm 9.9.4 are required (see `.nvmrc` and `engines` in `package.json`).

## Environment

Copy `.env` and adjust as needed:

- `VITE_BACKEND_HOST` / `VITE_BACKEND_PORT` — backend address for the Vite dev proxy (default `127.0.0.1:8111`).
- Leave `VITE_API_BASE` and `VITE_WS_URL` blank in dev so all requests go through the Vite proxy (same-origin, cookies work). Set them only for production builds served from a different host.
- Username is passed at runtime via `window.__APP_USERNAME__` or a `?username=` query param.

## Architecture

RIVA (Risk Investigator Virtual Assistant) is a React 19 + Vite SPA for AI-powered financial alert investigation.

### Data flow

1. **Session bootstrap** (`App.jsx`) — on mount, `fetchSession(username)` hits `GET /api/session`, receives a signed cookie + CSRF token, which is stored in the API client module-level var (`_csrf`) and dispatched to global state.
2. **WebSocket** (`useWebSocket.js`) — connects to `/ws/<username>` after session is ready. Receives `{ type: "alert", alert_id }` messages; auto-reconnects with a 3 s delay; pings every 30 s to keep the connection alive.
3. **Views** — the app has two views (`landing` | `chat`) toggled via `AppContext`. `LandingView` accepts a manual alert ID input. `ChatView` loads on a specific `currentAlertId`.
4. **ChatView lifecycle** — on each `alertId` change: fetch alert status → fetch chat history → if no history exists, auto-trigger `streamInvestigate`. Streaming responses are rendered incrementally via `onChunk`.

### State management

`AppContext.jsx` holds all global state in a single `useReducer`. Key fields:
- `view` — `'landing'` | `'chat'`
- `currentAlertId` — the alert being investigated
- `csrfToken` — injected into every API call via `api/client.js`
- `alertClosedMap` / `alertPriorityMap` — per-alert derived state, keyed by `alertId`
- `chatResetToken` — incrementing integer; `ChatView` watches this to re-run investigation without unmounting

### API client (`src/api/client.js`)

All requests go through `apiFetch`, which:
- Prefixes `VITE_API_BASE` when set
- Always sends `credentials: 'include'` (cookie-based auth)
- Injects `X-CSRF-Token` header automatically
- On 401, auto-reauths once via `fetchSession` before retrying (single in-flight re-auth coalesced with `_reauthInFlight`)

Streaming endpoints (`streamInvestigate`, `streamChat`) use the Fetch Streams API — the `onChunk(chunk, totalSoFar)` callback fires on every decoded chunk. `savePartialToServer` uses `navigator.sendBeacon` (falling back to `keepalive` fetch) so partial content is persisted even if the user navigates away.

### Utilities

- `parseSuggestions` — splits backend response on `<<<SUGGESTIONS>>>` separator; everything after it is pipe-delimited follow-up suggestion pills.
- `parsePriorityFromReport` — extracts a "False Positive Score" from the investigation text to derive `LOW` / `MEDIUM` / `HIGH` priority (≥90 = LOW, triggers "Close Alert" action; ≤50 = HIGH).
- `formatText` / `htmlToPlainText` — markdown-to-HTML rendering and HTML → plain-text extraction (used when building the PDF download payload).

### Styling

CSS custom properties are defined in `src/styles/variables.css`. The theme (light/dark) is stored in `AppContext` and applied by `useTheme.js` via a `data-theme` attribute on `<html>`. All layout tokens reference `var(--...)` variables.
