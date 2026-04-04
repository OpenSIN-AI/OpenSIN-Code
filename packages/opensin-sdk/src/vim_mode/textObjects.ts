export type TextObjectRange = { start: number; end: number } | null

const PAIRS: Record<string, [string, string]> = {
  '(': ['(', ')'], ')': ['(', ')'], b: ['(', ')'],
  '[': ['[', ']'], ']': ['[', ']'],
  '{': ['{', '}'], '}': ['{', '}'], B: ['{', '}'],
  '<': ['<', '>'], '>': ['<', '>'],
  '"': ['"', '"'], "'": ["'", "'"], '`': ['`', '`'],
}

function isWordChar(ch: string): boolean { return /[a-zA-Z0-9_]/.test(ch) }
function isWhitespace(ch: string): boolean { return /\s/.test(ch) }
function isPunctuation(ch: string): boolean { return /[^\w\s]/.test(ch) && ch.length > 0 }

export function findTextObject(text: string, offset: number, objectType: string, isInner: boolean): TextObjectRange {
  if (objectType === 'w') return findWordObject(text, offset, isInner, isWordChar)
  if (objectType === 'W') return findWordObject(text, offset, isInner, ch => !isWhitespace(ch))
  const pair = PAIRS[objectType]
  if (pair) {
    const [open, close] = pair
    return open === close ? findQuoteObject(text, offset, open, isInner) : findBracketObject(text, offset, open, close, isInner)
  }
  return null
}

function findWordObject(text: string, offset: number, isInner: boolean, isChar: (ch: string) => boolean): TextObjectRange {
  const chars = [...text]; let idx = 0; let charOffset = 0
  for (let i = 0; i < chars.length; i++) {
    if (offset >= charOffset && offset < charOffset + chars[i]!.length) { idx = i; break }
    charOffset += chars[i]!.length
    if (i === chars.length - 1) idx = i
  }
  let startIdx = idx; let endIdx = idx
  if (isChar(chars[idx] ?? '')) {
    while (startIdx > 0 && isChar(chars[startIdx - 1] ?? '')) startIdx--
    while (endIdx < chars.length && isChar(chars[endIdx] ?? '')) endIdx++
  } else if (isWhitespace(chars[idx] ?? '')) {
    while (startIdx > 0 && isWhitespace(chars[startIdx - 1] ?? '')) startIdx--
    while (endIdx < chars.length && isWhitespace(chars[endIdx] ?? '')) endIdx++
    return { start: getOffset(chars, startIdx), end: getOffset(chars, endIdx) }
  } else if (isPunctuation(chars[idx] ?? '')) {
    while (startIdx > 0 && isPunctuation(chars[startIdx - 1] ?? '')) startIdx--
    while (endIdx < chars.length && isPunctuation(chars[endIdx] ?? '')) endIdx++
  }
  if (!isInner) {
    if (endIdx < chars.length && isWhitespace(chars[endIdx] ?? '')) while (endIdx < chars.length && isWhitespace(chars[endIdx] ?? '')) endIdx++
    else if (startIdx > 0 && isWhitespace(chars[startIdx - 1] ?? '')) while (startIdx > 0 && isWhitespace(chars[startIdx - 1] ?? '')) startIdx--
  }
  return { start: getOffset(chars, startIdx), end: getOffset(chars, endIdx) }
}

function findQuoteObject(text: string, offset: number, quote: string, isInner: boolean): TextObjectRange {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1
  const lineEnd = text.indexOf('\n', offset); const effectiveEnd = lineEnd === -1 ? text.length : lineEnd
  const line = text.slice(lineStart, effectiveEnd); const posInLine = offset - lineStart
  const positions: number[] = []
  for (let i = 0; i < line.length; i++) if (line[i] === quote) positions.push(i)
  for (let i = 0; i < positions.length - 1; i += 2) {
    const qs = positions[i]!; const qe = positions[i + 1]!
    if (qs <= posInLine && posInLine <= qe) return isInner ? { start: lineStart + qs + 1, end: lineStart + qe } : { start: lineStart + qs, end: lineStart + qe + 1 }
  }
  return null
}

function findBracketObject(text: string, offset: number, open: string, close: string, isInner: boolean): TextObjectRange {
  let depth = 0; let start = -1
  for (let i = offset; i >= 0; i--) {
    if (text[i] === close && i !== offset) depth++
    else if (text[i] === open) { if (depth === 0) { start = i; break } depth-- }
  }
  if (start === -1) return null
  depth = 0; let end = -1
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === open) depth++
    else if (text[i] === close) { if (depth === 0) { end = i; break } depth-- }
  }
  if (end === -1) return null
  return isInner ? { start: start + 1, end } : { start, end: end + 1 }
}

function getOffset(chars: string[], index: number): number {
  let offset = 0
  for (let i = 0; i < index && i < chars.length; i++) offset += chars[i]!.length
  return offset
}
