import { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)

const initialState = {
  userId: '',               // set from ?username= or window.__APP_USERNAME__
  view: 'landing',         // 'landing' | 'chat'
  currentCaseId: '',
  alertPriorityMap: {},    // { [caseId]: 'LOW'|'MEDIUM'|'HIGH' }
  theme: 'light',
  sidebarCollapsed: false,
  chatResetToken: 0,
  recentCases: [],         // [{ caseId }] — local history, newest first
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER_ID':
      return { ...state, userId: action.payload }

    case 'SET_THEME':
      return { ...state, theme: action.payload }

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }

    case 'SET_ALERT_PRIORITY':
      return {
        ...state,
        alertPriorityMap: { ...state.alertPriorityMap, [action.caseId]: action.value },
      }

    case 'SHOW_CHAT': {
      const caseId = action.caseId
      // Prepend to recent cases, de-duplicate
      const filtered = state.recentCases.filter((c) => c.caseId !== caseId)
      return {
        ...state,
        view: 'chat',
        currentCaseId: caseId,
        recentCases: [{ caseId }, ...filtered],
      }
    }

    case 'SHOW_LANDING':
      return { ...state, view: 'landing', currentCaseId: '' }

    case 'RESET_CURRENT_CHAT':
      return { ...state, chatResetToken: state.chatResetToken + 1 }

    case 'REMOVE_CASE': {
      const filtered = state.recentCases.filter((c) => c.caseId !== action.caseId)
      const isActive = state.currentCaseId === action.caseId
      return {
        ...state,
        recentCases: filtered,
        view: isActive ? 'landing' : state.view,
        currentCaseId: isActive ? '' : state.currentCaseId,
      }
    }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
