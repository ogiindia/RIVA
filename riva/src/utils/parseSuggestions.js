// Frontend/src/utils/parseSuggestions.js
const SEPARATOR = '<<<SUGGESTIONS>>>'

export function parseSuggestions(text) {
  let idx = text.indexOf(SEPARATOR)
  if (idx === -1) {
    const match = text.match(/<<<\s*SUGGESTIONS\s*>>>/i)
    if (match) idx = match.index
  }
  if (idx === -1) return { cleanText: text, suggestions: [] }

  const cleanText = text.substring(0, idx).trimEnd()
  const afterSep = text.substring(idx)
  const suggestionsRaw = afterSep.replace(/<<<\s*SUGGESTIONS\s*>>>/i, '').trim()
  const suggestions = suggestionsRaw
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 200)
  return { cleanText, suggestions }
}
