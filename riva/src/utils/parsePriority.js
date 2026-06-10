// Frontend/src/utils/parsePriority.js
export function parsePriorityFromReport(text) {
  if (!text) return 'HIGH'
  const clean = text.replace(/\*\*/g, '').replace(/^###\s*/gm, '')
  const match = clean.match(/[Ff]alse\s+[Pp]ositive\s+[Ss]core\s*(?:\([^)]*\))?\s*:\s*(\d+)/)
  if (match) {
    const score = parseInt(match[1], 10)
    if (score >= 90) return 'LOW'
    if (score > 50)  return 'MEDIUM'
    return 'HIGH'
  }
  return 'HIGH'
}
