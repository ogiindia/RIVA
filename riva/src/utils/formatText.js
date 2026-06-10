// Frontend/src/utils/formatText.js

/** Format completed LLM text to HTML */
export function formatText(raw) {
  let s = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  s = s.replace(/^###\s*(.+)$/gm, '<h1 class="chat-h1">$1</h1>')
  s = s.replace(/^(\*\*(.+?)\*\*)$/gm, '<strong class="chat-heading">$2</strong>')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  return s
}

/**
 * Streaming-safe display: strips suggestions block, hides incomplete
 * markdown tokens at the tail of in-progress text.
 */
export function getStreamDisplayHtml(raw) {
  let text = raw

  const ltIdx = text.indexOf('<<<')
  if (ltIdx !== -1) text = text.substring(0, ltIdx)

  const lastNewline = text.lastIndexOf('\n')
  let completeLines, tailLine
  if (lastNewline === -1) {
    completeLines = ''
    tailLine = text
  } else {
    completeLines = text.substring(0, lastNewline + 1)
    tailLine = text.substring(lastNewline + 1)
  }

  const tailTrimmed = tailLine.trimStart()
  if (/^#{1,4}$/.test(tailTrimmed) || /^\*{1,2}$/.test(tailTrimmed)) {
    tailLine = ''
  }
  tailLine = tailLine.replace(/<{1,2}$/, '')

  let html = formatText(completeLines)
  if (tailLine) {
    const safeTail = tailLine
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    html += safeTail
  }
  return html
}

/**
 * Strip HTML tags to get plain text for clipboard copy.
 * @browser-only — requires DOM (document.createElement). Use jsdom in tests.
 */
export function htmlToPlainText(html) {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || el.innerText || ''
}
