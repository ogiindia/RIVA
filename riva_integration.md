# Riva Integration Guide

Riva is an AI assistant panel that slides in from the right side of your app. It loads a separate web app (the Riva UI) inside an `<iframe>` and is toggled via a floating action button (FAB). The panel is resizable by dragging and its width persists across sessions via `localStorage`.

---

## What You're Building

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar │  Main Content Area          │ ▌ │  Riva Panel  │
│         │  (your page content)        │   │  (iframe)    │
│         │                             │   │              │
│         │                             │   │  [Riva UI]   │
│         │                   [FAB] ──► │   │              │
└─────────────────────────────────────────────────────────┘
```

- **FAB** — fixed floating button, bottom-right, visible when panel is closed
- **Panel** — flex column appended beside `<main>`, contains a header + iframe
- **Drag handle** — 4px wide divider between main content and panel, pointer-draggable to resize

---

## Prerequisites

Your project needs:

- React 18+
- React Router v6 (for route-scoping — optional, can be removed)
- [lucide-react](https://lucide.dev/) for icons
- [shadcn/ui](https://ui.shadcn.com/) `Button` and `Tooltip` components — **or** replace with your own button/tooltip (see [Without shadcn/ui](#without-shadcnui))
- Tailwind CSS

If you don't use Tailwind or shadcn, see the [Plain CSS / Non-Tailwind](#plain-css--non-tailwind) section.

---

## File Structure

Copy these 4 files into your project:

```
src/
├── components/
│   └── layout/
│       ├── RivaFab.tsx       # Floating action button
│       └── RivaPanel.tsx     # Sliding panel with iframe
├── hooks/
│   └── useRivaPanel.ts       # Open/close state + resize logic
└── config/
    └── rivaTheme.ts          # Visual theme tokens
```

---

## Step 1 — Copy the Source Files

### `src/hooks/useRivaPanel.ts`

Manages open/close state, panel width (with localStorage persistence), and pointer-drag resize.

```typescript
import { useState, useRef, useCallback } from 'react'

const STORAGE_KEY = 'riva-panel-width'
const DEFAULT_WIDTH = 30   // percentage of viewport
const MIN_WIDTH = 20
const MAX_WIDTH = 60

function loadWidth(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_WIDTH
  const parsed = parseInt(raw, 10)
  if (isNaN(parsed)) return DEFAULT_WIDTH
  return Math.min(Math.max(parsed, MIN_WIDTH), MAX_WIDTH)
}

export function useRivaPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [rivaWidth, setRivaWidth] = useState<number>(loadWidth)
  const containerRef = useRef<HTMLDivElement>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const handleDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()

      function onMove(ev: PointerEvent) {
        const newWidth = ((rect.right - ev.clientX) / rect.width) * 100
        const clamped = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH)
        setRivaWidth(clamped)
      }

      function onUp() {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        setRivaWidth((w) => {
          const rounded = Math.round(w)
          localStorage.setItem(STORAGE_KEY, String(rounded))
          return rounded
        })
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [],
  )

  return { isOpen, rivaWidth, containerRef, open, close, handleDragStart }
}
```

**Key details:**
- `containerRef` must be attached to the flex container that wraps both `<main>` and `<RivaPanel>`. The drag calculation uses this container's bounding rect.
- Width is stored as an integer percentage string in `localStorage` under the key `'riva-panel-width'`. Change `STORAGE_KEY` if you have conflicts.
- `MIN_WIDTH = 20` and `MAX_WIDTH = 60` are in percentage units. Adjust to taste.

---

### `src/config/rivaTheme.ts`

Two built-in themes. Set `ACTIVE_RIVA_THEME` to switch between them.

```typescript
export type RivaTheme = 'casemanager' | 'riva-branded'

/**
 * 'casemanager' — inherits your app's sidebar colours (neutral, blends in)
 * 'riva-branded' — indigo accent header (stands out as a distinct tool)
 */
export const ACTIVE_RIVA_THEME: RivaTheme = 'casemanager'

interface RivaThemeConfig {
  panelBg: string
  panelBorder: string
  headerBg: string
  headerBorder: string
  headerText: string
  iconColor: string
}

export const rivaThemes: Record<RivaTheme, RivaThemeConfig> = {
  'casemanager': {
    panelBg: 'bg-background',
    panelBorder: 'border-border',
    headerBg: 'bg-sidebar',
    headerBorder: 'border-sidebar-border',
    headerText: 'text-sidebar-foreground',
    iconColor: 'text-sidebar-primary',
  },
  'riva-branded': {
    panelBg: 'bg-indigo-50 dark:bg-indigo-950',
    panelBorder: 'border-indigo-300 dark:border-indigo-700',
    headerBg: 'bg-indigo-600 dark:bg-indigo-800',
    headerBorder: 'border-indigo-500 dark:border-indigo-600',
    headerText: 'text-white',
    iconColor: 'text-indigo-200',
  },
}
```

**To add a custom theme:** add a new key to the `RivaTheme` union and add its config object to `rivaThemes`. All values are Tailwind classes.

---

### `src/components/layout/RivaFab.tsx`

The floating action button. Renders a fixed-position bot icon at bottom-right.

```tsx
import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface RivaFabProps {
  onOpen: () => void
}

export function RivaFab({ onOpen }: RivaFabProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            onClick={onOpen}
            aria-label="Ask Riva"
            className="h-11 w-11 rounded-full shadow-lg"
          >
            <Bot className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Ask Riva</TooltipContent>
      </Tooltip>
    </div>
  )
}
```

**Notes:**
- `z-50` keeps it above most content. Increase if it hides behind modals or drawers.
- The `TooltipProvider` must be an ancestor in the tree — see Step 2.

---

### `src/components/layout/RivaPanel.tsx`

The sliding panel. A flex column with a fixed header and a full-height iframe.

```tsx
import { Bot, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ACTIVE_RIVA_THEME, rivaThemes } from '@/config/rivaTheme'

interface RivaPanelProps {
  rivaUrl: string    // URL of the Riva web app
  width: number      // panel width as a percentage (e.g. 30)
  onClose: () => void
}

export function RivaPanel({ rivaUrl, width, onClose }: RivaPanelProps) {
  const t = rivaThemes[ACTIVE_RIVA_THEME]

  return (
    <div
      className={`flex flex-col border-l shrink-0 ${t.panelBg} ${t.panelBorder}`}
      style={{ width: `${width}%` }}
    >
      <div className={`h-10 flex items-center justify-between px-3 border-b shrink-0 ${t.headerBg} ${t.headerBorder}`}>
        <div className={`flex items-center gap-2 text-sm font-medium ${t.headerText}`}>
          <Bot className={`h-4 w-4 ${t.iconColor}`} />
          <span>Riva</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close Riva"
          className={`h-7 w-7 ${t.headerText} hover:bg-black/10`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={rivaUrl}
          title="Riva"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  )
}
```

**iframe sandbox attributes explained:**
| Attribute | Why it's needed |
|---|---|
| `allow-scripts` | Riva UI requires JS to run |
| `allow-same-origin` | Allows the iframe to access its own cookies/storage |
| `allow-forms` | Allows form submissions inside Riva |

If Riva is hosted on a different domain and needs to open links, also add `allow-popups`.

---

## Step 2 — Wire It Into Your Layout

Find your top-level layout component (the one that wraps your page content with a sidebar and nav). Add the following:

```tsx
import { useLocation } from 'react-router-dom'  // only if using React Router
import { TooltipProvider } from '@/components/ui/tooltip'
import { RivaFab } from './RivaFab'
import { RivaPanel } from './RivaPanel'
import { useRivaPanel } from '@/hooks/useRivaPanel'

const RIVA_URL = import.meta.env.VITE_RIVA_URL ?? 'http://localhost:5173'

// Optional: restrict FAB/panel to specific routes
function useIsRivaPage() {
  const { pathname } = useLocation()
  return pathname === '/alerts' || pathname.startsWith('/alerts/')
}

export default function AppLayout() {
  const { isOpen, rivaWidth, containerRef, open, close, handleDragStart } = useRivaPanel()
  const isRivaPage = useIsRivaPage()   // remove this if you want Riva on all pages

  const rivaVisible = isRivaPage && isOpen

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">

        {/* Your sidebar here */}
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Your top nav here */}
          <TopNav />

          {/* This div MUST have ref={containerRef} and be a flex row */}
          <div ref={containerRef} className="flex flex-1 overflow-hidden">

            <main className="flex-1 overflow-auto p-6 min-w-0">
              {/* Your page content / router outlet */}
              <Outlet />
            </main>

            {rivaVisible && (
              <>
                {/* Drag handle — sits between main and panel */}
                <div
                  data-testid="riva-drag-handle"
                  className="w-1 cursor-col-resize bg-border hover:bg-primary transition-colors shrink-0"
                  onPointerDown={handleDragStart}
                />
                <RivaPanel rivaUrl={RIVA_URL} width={rivaWidth} onClose={close} />
              </>
            )}
          </div>
        </div>

        {/* FAB — only show when on a riva page and panel is closed */}
        {isRivaPage && !isOpen && <RivaFab onOpen={open} />}

      </div>
    </TooltipProvider>
  )
}
```

**Critical layout requirements:**
- The `ref={containerRef}` div must be a **flex row** (`flex`) so the panel appears side-by-side with `<main>`.
- `<main>` needs `flex-1 min-w-0` so it shrinks when the panel opens.
- `<RivaPanel>` uses `shrink-0` so it never collapses below its set width.
- The drag handle must sit **between** `<main>` and `<RivaPanel>` in the DOM.
- `TooltipProvider` must wrap everything — the FAB's tooltip depends on it.

---

## Step 3 — Environment Variable

Add to your `.env` (or `.env.local`):

```
VITE_RIVA_URL=https://your-riva-instance.com
```

For local development with Riva running locally:
```
VITE_RIVA_URL=http://localhost:5173
```

The code falls back to `http://localhost:5173` if the variable is missing, so local dev works without any `.env` setup.

---

## Route Scoping

By default in this reference implementation, the FAB and panel only appear on `/alerts` and `/alerts/*` routes. To change this:

**Show Riva on all pages — remove the guard entirely:**
```tsx
// Replace:
const rivaVisible = isRivaPage && isOpen
{isRivaPage && !isOpen && <RivaFab onOpen={open} />}

// With:
const rivaVisible = isOpen
{!isOpen && <RivaFab onOpen={open} />}
```

**Show on specific routes:**
```tsx
function useIsRivaPage() {
  const { pathname } = useLocation()
  return ['/dashboard', '/reports'].some(p => pathname.startsWith(p))
}
```

**If you're not using React Router**, replace `useIsRivaPage` with any boolean from your routing solution, or just use `true`.

---

## Customising the Theme

Change `ACTIVE_RIVA_THEME` in `src/config/rivaTheme.ts`:

```typescript
// Blends with your app's sidebar colours (default)
export const ACTIVE_RIVA_THEME: RivaTheme = 'casemanager'

// Indigo accent — visually distinct from your app
export const ACTIVE_RIVA_THEME: RivaTheme = 'riva-branded'
```

To add a fully custom theme:
```typescript
export type RivaTheme = 'casemanager' | 'riva-branded' | 'my-theme'

export const rivaThemes: Record<RivaTheme, RivaThemeConfig> = {
  // ... existing themes ...
  'my-theme': {
    panelBg: 'bg-white dark:bg-zinc-900',
    panelBorder: 'border-zinc-200 dark:border-zinc-700',
    headerBg: 'bg-emerald-600',
    headerBorder: 'border-emerald-500',
    headerText: 'text-white',
    iconColor: 'text-emerald-200',
  },
}
```

---

## Without shadcn/ui

Replace the shadcn imports in `RivaFab.tsx` and `RivaPanel.tsx` with plain HTML or your own UI library.

**`RivaFab.tsx` without shadcn:**
```tsx
import { Bot } from 'lucide-react'

export function RivaFab({ onOpen }: { onOpen: () => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50 }}>
      <button
        onClick={onOpen}
        aria-label="Ask Riva"
        title="Ask Riva"
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#4f46e5', color: 'white', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <Bot size={20} />
      </button>
    </div>
  )
}
```

**`RivaPanel.tsx` close button without shadcn:**
```tsx
<button
  onClick={onClose}
  aria-label="Close Riva"
  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
>
  <X size={16} />
</button>
```

Also remove the `TooltipProvider` wrapper from your layout if you remove the shadcn Tooltip.

---

## Plain CSS / Non-Tailwind

The layout depends on flexbox. The core CSS you need:

```css
/* Container that holds main + riva panel side by side */
.riva-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Your page content */
.riva-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 24px;
}

/* Drag handle */
.riva-drag-handle {
  width: 4px;
  cursor: col-resize;
  background: #e2e8f0;
  flex-shrink: 0;
  transition: background 0.15s;
}
.riva-drag-handle:hover {
  background: #6366f1;
}

/* Panel */
.riva-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-left: 1px solid #e2e8f0;
  background: #fff;
  /* width is set inline via style={{ width: `${width}%` }} */
}

/* Panel header */
.riva-panel-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

/* iframe wrapper */
.riva-iframe-wrapper {
  flex: 1;
  overflow: hidden;
}
.riva-iframe-wrapper iframe {
  width: 100%;
  height: 100%;
  border: none;
}
```

---

## Checklist

- [ ] Copied `useRivaPanel.ts`, `RivaFab.tsx`, `RivaPanel.tsx`, `rivaTheme.ts`
- [ ] Added `VITE_RIVA_URL` to `.env`
- [ ] Layout container has `ref={containerRef}` and `display: flex` (row direction)
- [ ] `<main>` has `flex: 1` and `min-width: 0`
- [ ] Drag handle is positioned between `<main>` and `<RivaPanel>` in the DOM
- [ ] `TooltipProvider` wraps the layout (shadcn only)
- [ ] Verified iframe loads with the correct URL in browser devtools
- [ ] Adjusted route scoping (`useIsRivaPage`) to match your app's routes
