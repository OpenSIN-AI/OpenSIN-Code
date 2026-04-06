export interface Cursor {
  offset: number; text: string
  left(): Cursor; right(): Cursor; down(): Cursor; up(): Cursor
  downLogicalLine(): Cursor; upLogicalLine(): Cursor
  nextVimWord(): Cursor; prevVimWord(): Cursor; endOfVimWord(): Cursor
  nextWORD(): Cursor; prevWORD(): Cursor; endOfWORD(): Cursor
  startOfLogicalLine(): Cursor; firstNonBlankInLogicalLine(): Cursor; endOfLogicalLine(): Cursor
  startOfFirstLine(): Cursor; startOfLastLine(): Cursor; goToLine(line: number): Cursor
  findCharacter(char: string, findType: string, count: number): number | null
  equals(other: Cursor): boolean; isAtEnd(): boolean; getPosition(): { line: number; col: number }
}

export function resolveMotion(key: string, cursor: Cursor, count: number): Cursor {
  let result = cursor
  for (let i = 0; i < count; i++) {
    const next = applySingleMotion(key, result)
    if (next.equals(result)) break
    result = next
  }
  return result
}

function applySingleMotion(key: string, cursor: Cursor): Cursor {
  switch (key) {
    case 'h': return cursor.left()
    case 'l': return cursor.right()
    case 'j': return cursor.downLogicalLine()
    case 'k': return cursor.upLogicalLine()
    case 'gj': return cursor.down()
    case 'gk': return cursor.up()
    case 'w': return cursor.nextVimWord()
    case 'b': return cursor.prevVimWord()
    case 'e': return cursor.endOfVimWord()
    case 'W': return cursor.nextWORD()
    case 'B': return cursor.prevWORD()
    case 'E': return cursor.endOfWORD()
    case '0': return cursor.startOfLogicalLine()
    case '^': return cursor.firstNonBlankInLogicalLine()
    case '$': return cursor.endOfLogicalLine()
    case 'G': return cursor.startOfLastLine()
    default: return cursor
  }
}

export function isInclusiveMotion(key: string): boolean { return 'eE$'.includes(key) }
export function isLinewiseMotion(key: string): boolean { return 'jkG'.includes(key) || key === 'gg' }
