// Frontend/src/utils/initials.js

/**
 * getInitials — derive avatar initials from a person's name.
 *
 *   ''                    -> 'U'
 *   null / undefined      -> 'U'
 *   'vijay'               -> 'V'
 *   'vijay kumar'         -> 'VK'
 *   'vijay kumar reddy'   -> 'VR'
 *   '   '                 -> 'U'
 *
 * Falls back to 'U' for any non-string / empty input so the UI never blanks.
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  const first = parts[0][0]
  const last = parts[parts.length - 1][0]
  return (first + last).toUpperCase()
}
