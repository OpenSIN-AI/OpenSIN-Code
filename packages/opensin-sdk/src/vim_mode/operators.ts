import { isInclusiveMotion, isLinewiseMotion, resolveMotion, type Cursor } from './motions.js'
import { findTextObject } from './textObjects.js'
import type { FindType, Operator, RecordedChange, TextObjScope } from './types.js'

export type OperatorContext = {
  cursor: Cursor; text: string
  setText: (text: string) => void; setOffset: (offset: number) => void
  enterInsert: (offset: number) => void
  getRegister: () => string; setRegister: (content: string, linewise: boolean) => void
  getLastFind: () => { type: FindType; char: string } | null
  setLastFind: (type: FindType, char: string) => void
  recordChange: (change: RecordedChange) => void
}

export function executeOperatorMotion(op: Operator, motion: string, count: number, ctx: OperatorContext): void {
  const target = resolveMotion(motion, ctx.cursor, count)
  if (target.equals(ctx.cursor)) return
  const range = getOpRange(ctx.cursor, target, motion, op, count)
  applyOperator(op, range.from, range.to, ctx, range.linewise)
  ctx.recordChange({ type: 'operator', op, motion, count })
}

export function executeOperatorFind(op: Operator, findType: FindType, char: string, count: number, ctx: OperatorContext): void {
  const targetOffset = ctx.cursor.findCharacter(char, findType, count)
  if (targetOffset === null) return
  applyOperator(op, Math.min(ctx.cursor.offset, targetOffset), targetOffset + 1, ctx)
  ctx.setLastFind(findType, char)
  ctx.recordChange({ type: 'operatorFind', op, find: findType, char, count })
}

export function executeOperatorTextObj(op: Operator, scope: TextObjScope, objType: string, count: number, ctx: OperatorContext): void {
  const range = findTextObject(ctx.text, ctx.cursor.offset, objType, scope === 'inner')
  if (!range) return
  applyOperator(op, range.start, range.end, ctx)
  ctx.recordChange({ type: 'operatorTextObj', op, objType, scope, count })
}

export function executeLineOp(op: Operator, count: number, ctx: OperatorContext): void {
  const text = ctx.text; const lines = text.split('\n')
  const currentLine = text.slice(0, ctx.cursor.offset).split('\n').length - 1
  const linesToAffect = Math.min(count, lines.length - currentLine)
  const lineStart = ctx.cursor.startOfLogicalLine().offset
  let lineEnd = lineStart
  for (let i = 0; i < linesToAffect; i++) {
    const nextNewline = text.indexOf('\n', lineEnd)
    lineEnd = nextNewline === -1 ? text.length : nextNewline + 1
  }
  let content = text.slice(lineStart, lineEnd)
  if (!content.endsWith('\n')) content += '\n'
  ctx.setRegister(content, true)
  if (op === 'yank') ctx.setOffset(lineStart)
  else if (op === 'delete') {
    let ds = lineStart
    if (lineEnd === text.length && ds > 0 && text[ds - 1] === '\n') ds -= 1
    const newText = text.slice(0, ds) + text.slice(lineEnd)
    ctx.setText(newText || ''); ctx.setOffset(Math.min(ds, Math.max(0, newText.length - 1)))
  } else if (op === 'change') {
    if (lines.length === 1) { ctx.setText(''); ctx.enterInsert(0) }
    else {
      const newText = [...lines.slice(0, currentLine), '', ...lines.slice(currentLine + linesToAffect)].join('\n')
      ctx.setText(newText); ctx.enterInsert(lineStart)
    }
  }
  ctx.recordChange({ type: 'operator', op, motion: op[0]!, count })
}

export function executeX(count: number, ctx: OperatorContext): void {
  const from = ctx.cursor.offset
  if (from >= ctx.text.length) return
  let endCursor = ctx.cursor
  for (let i = 0; i < count && !endCursor.isAtEnd(); i++) endCursor = endCursor.right()
  const to = endCursor.offset
  const deleted = ctx.text.slice(from, to)
  const newText = ctx.text.slice(0, from) + ctx.text.slice(to)
  ctx.setRegister(deleted, false); ctx.setText(newText)
  ctx.setOffset(Math.min(from, Math.max(0, newText.length - 1)))
  ctx.recordChange({ type: 'x', count })
}

export function executeReplace(char: string, count: number, ctx: OperatorContext): void {
  let offset = ctx.cursor.offset; let newText = ctx.text
  for (let i = 0; i < count && offset < newText.length; i++) {
    newText = newText.slice(0, offset) + char + newText.slice(offset + 1)
    offset += char.length
  }
  ctx.setText(newText); ctx.setOffset(Math.max(0, offset - char.length))
  ctx.recordChange({ type: 'replace', char, count })
}

export function executeToggleCase(count: number, ctx: OperatorContext): void {
  const startOffset = ctx.cursor.offset
  if (startOffset >= ctx.text.length) return
  let newText = ctx.text; let offset = startOffset; let toggled = 0
  while (offset < newText.length && toggled < count) {
    const ch = newText[offset]!
    newText = newText.slice(0, offset) + (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()) + newText.slice(offset + 1)
    offset++; toggled++
  }
  ctx.setText(newText); ctx.setOffset(offset)
  ctx.recordChange({ type: 'toggleCase', count })
}

export function executeJoin(count: number, ctx: OperatorContext): void {
  const text = ctx.text; const lines = text.split('\n')
  const { line: currentLine } = ctx.cursor.getPosition()
  if (currentLine >= lines.length - 1) return
  const linesToJoin = Math.min(count, lines.length - currentLine - 1)
  let joinedLine = lines[currentLine]!; const cursorPos = joinedLine.length
  for (let i = 1; i <= linesToJoin; i++) {
    const nextLine = (lines[currentLine + i] ?? '').trimStart()
    if (nextLine.length > 0) { if (!joinedLine.endsWith(' ') && joinedLine.length > 0) joinedLine += ' '; joinedLine += nextLine }
  }
  const newLines = [...lines.slice(0, currentLine), joinedLine, ...lines.slice(currentLine + linesToJoin + 1)]
  const newText = newLines.join('\n'); ctx.setText(newText)
  const lineStartOffset = newLines.slice(0, currentLine).join('\n').length + (currentLine > 0 ? 1 : 0)
  ctx.setOffset(lineStartOffset + cursorPos); ctx.recordChange({ type: 'join', count })
}

export function executePaste(after: boolean, count: number, ctx: OperatorContext): void {
  const register = ctx.getRegister(); if (!register) return
  const isLinewise = register.endsWith('\n')
  const content = isLinewise ? register.slice(0, -1) : register
  if (isLinewise) {
    const lines = ctx.text.split('\n'); const { line: currentLine } = ctx.cursor.getPosition()
    const insertLine = after ? currentLine + 1 : currentLine
    const contentLines = content.split('\n'); const repeatedLines: string[] = []
    for (let i = 0; i < count; i++) repeatedLines.push(...contentLines)
    const newLines = [...lines.slice(0, insertLine), ...repeatedLines, ...lines.slice(insertLine)]
    const newText = newLines.join('\n'); ctx.setText(newText)
    const lineStartOffset = newLines.slice(0, insertLine).join('\n').length + (insertLine > 0 ? 1 : 0)
    ctx.setOffset(lineStartOffset)
  } else {
    const textToInsert = content.repeat(count)
    const insertPoint = after && ctx.cursor.offset < ctx.text.length ? ctx.cursor.offset + 1 : ctx.cursor.offset
    const newText = ctx.text.slice(0, insertPoint) + textToInsert + ctx.text.slice(insertPoint)
    ctx.setText(newText); ctx.setOffset(Math.max(insertPoint, insertPoint + textToInsert.length - 1))
  }
}

export function executeIndent(dir: '>' | '<', count: number, ctx: OperatorContext): void {
  const text = ctx.text; const lines = text.split('\n')
  const { line: currentLine } = ctx.cursor.getPosition()
  const linesToAffect = Math.min(count, lines.length - currentLine); const indent = '  '
  for (let i = 0; i < linesToAffect; i++) {
    const lineIdx = currentLine + i; const line = lines[lineIdx] ?? ''
    if (dir === '>') lines[lineIdx] = indent + line
    else if (line.startsWith(indent)) lines[lineIdx] = line.slice(indent.length)
    else if (line.startsWith('\t')) lines[lineIdx] = line.slice(1)
    else { let idx = 0; while (idx < line.length && idx < indent.length && /\s/.test(line[idx]!)) idx++; lines[lineIdx] = line.slice(idx) }
  }
  const newText = lines.join('\n')
  const currentLineText = lines[currentLine] ?? ''
  const firstNonBlank = (currentLineText.match(/^\s*/)?.[0] ?? '').length
  ctx.setText(newText)
  const lineStartOffset = lines.slice(0, currentLine).join('\n').length + (currentLine > 0 ? 1 : 0)
  ctx.setOffset(lineStartOffset + firstNonBlank)
  ctx.recordChange({ type: 'indent', dir, count })
}

export function executeOpenLine(direction: 'above' | 'below', ctx: OperatorContext): void {
  const text = ctx.text; const lines = text.split('\n')
  const { line: currentLine } = ctx.cursor.getPosition()
  const insertLine = direction === 'below' ? currentLine + 1 : currentLine
  const newLines = [...lines.slice(0, insertLine), '', ...lines.slice(insertLine)]
  const newText = newLines.join('\n'); ctx.setText(newText)
  const lineStartOffset = newLines.slice(0, insertLine).join('\n').length + (insertLine > 0 ? 1 : 0)
  ctx.enterInsert(lineStartOffset); ctx.recordChange({ type: 'openLine', direction })
}

export function executeOperatorG(op: Operator, count: number, ctx: OperatorContext): void {
  const target = count === 1 ? ctx.cursor.startOfLastLine() : ctx.cursor.goToLine(count)
  if (target.equals(ctx.cursor)) return
  const range = getOpRange(ctx.cursor, target, 'G', op, count)
  applyOperator(op, range.from, range.to, ctx, range.linewise)
  ctx.recordChange({ type: 'operator', op, motion: 'G', count })
}

export function executeOperatorGg(op: Operator, count: number, ctx: OperatorContext): void {
  const target = count === 1 ? ctx.cursor.startOfFirstLine() : ctx.cursor.goToLine(count)
  if (target.equals(ctx.cursor)) return
  const range = getOpRange(ctx.cursor, target, 'gg', op, count)
  applyOperator(op, range.from, range.to, ctx, range.linewise)
  ctx.recordChange({ type: 'operator', op, motion: 'gg', count })
}

function getOpRange(cursor: Cursor, target: Cursor, motion: string, op: Operator, count: number): { from: number; to: number; linewise: boolean } {
  let from = Math.min(cursor.offset, target.offset)
  let to = Math.max(cursor.offset, target.offset); let linewise = false
  if (op === 'change' && (motion === 'w' || motion === 'W')) {
    let wc = cursor
    for (let i = 0; i < count - 1; i++) wc = motion === 'w' ? wc.nextVimWord() : wc.nextWORD()
    const we = motion === 'w' ? wc.endOfVimWord() : wc.endOfWORD(); to = we.offset + 1
  } else if (isLinewiseMotion(motion)) {
    linewise = true; const text = cursor.text; const nextNewline = text.indexOf('\n', to)
    if (nextNewline === -1) { to = text.length; if (from > 0 && text[from - 1] === '\n') from -= 1 }
    else to = nextNewline + 1
  } else if (isInclusiveMotion(motion) && cursor.offset <= target.offset) to = to + 1
  return { from, to, linewise }
}

function applyOperator(op: Operator, from: number, to: number, ctx: OperatorContext, linewise = false): void {
  let content = ctx.text.slice(from, to)
  if (linewise && !content.endsWith('\n')) content += '\n'
  ctx.setRegister(content, linewise)
  if (op === 'yank') ctx.setOffset(from)
  else if (op === 'delete') {
    const newText = ctx.text.slice(0, from) + ctx.text.slice(to)
    ctx.setText(newText); ctx.setOffset(Math.min(from, Math.max(0, newText.length - 1)))
  } else if (op === 'change') {
    const newText = ctx.text.slice(0, from) + ctx.text.slice(to)
    ctx.setText(newText); ctx.enterInsert(from)
  }
}
