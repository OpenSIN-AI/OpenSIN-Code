import React, { useEffect, useRef, useState } from 'react'
import type { Companion } from './types.js'
import { RARITY_COLORS } from './types.js'
import { renderFace, renderSprite, spriteFrameCount } from './sprites.js'

const TICK_MS = 500
const BUBBLE_SHOW = 20
const FADE_WINDOW = 6
const PET_BURST_MS = 2500
const MIN_COLS = 100
const IDLE_SEQ = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0]

interface Props {
  companion: Companion | undefined
  reaction?: string
  petAt?: number
  focused?: boolean
  columns?: number
  muted?: boolean
  onReactionCleared?: () => void
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (cur.length + w.length + 1 > width && cur) { lines.push(cur); cur = w }
    else cur = cur ? `${cur} ${w}` : w
  }
  if (cur) lines.push(cur)
  return lines
}

export function CompanionSprite({ companion, reaction, petAt, focused = false, columns = 120, muted = false, onReactionCleared }: Props): React.ReactNode {
  const [tick, setTick] = useState(0)
  const lastSpokeTick = useRef(0)
  const [{ petStartTick, forPetAt }, setPetStart] = useState({ petStartTick: 0, forPetAt: petAt })

  if (petAt !== forPetAt) setPetStart({ petStartTick: tick, forPetAt: petAt })

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!reaction) return
    lastSpokeTick.current = tick
    const timer = setTimeout(() => onReactionCleared?.(), BUBBLE_SHOW * TICK_MS)
    return () => clearTimeout(timer)
  }, [reaction, onReactionCleared])

  if (!companion || muted) return null

  const color = RARITY_COLORS[companion.rarity] || 'inactive'
  const bubbleAge = reaction ? tick - lastSpokeTick.current : 0
  const fading = reaction !== undefined && bubbleAge >= BUBBLE_SHOW - FADE_WINDOW
  const petAge = petAt ? tick - petStartTick : Infinity
  const petting = petAge * TICK_MS < PET_BURST_MS

  if (columns < MIN_COLS) {
    const quip = reaction && reaction.length > 24 ? reaction.slice(0, 23) + '...' : reaction
    const label = quip ? `"${quip}"` : focused ? ` ${companion.name} ` : companion.name
    return React.createElement('div', { style: { display: 'flex', alignItems: 'center', padding: '0 4px' } },
      petting && React.createElement('span', { style: { color: '#4ade80' } }, '♥ '),
      React.createElement('span', { style: { fontWeight: 'bold', color } }, renderFace(companion)),
      ' ',
      React.createElement('span', { style: { fontStyle: 'italic', opacity: !focused && !reaction ? 0.5 : 1, fontWeight: focused ? 'bold' : 'normal', color: reaction ? (fading ? '#666' : color) : focused ? color : undefined } }, label),
    )
  }

  const frameCount = spriteFrameCount(companion.species)
  let spriteFrame: number
  let blink = false
  if (reaction || petting) {
    spriteFrame = tick % frameCount
  } else {
    const step = IDLE_SEQ[tick % IDLE_SEQ.length]!
    if (step === -1) { spriteFrame = 0; blink = true }
    else spriteFrame = step % frameCount
  }

  const body = renderSprite(companion, spriteFrame).map(line => blink ? line.replaceAll(companion.eye, '-') : line)
  const spriteLines = body.map((line, i) => React.createElement('div', { key: i, style: { color, fontFamily: 'monospace', lineHeight: 1.2 } }, line))

  if (!reaction) {
    return React.createElement('div', { style: { padding: '0 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' } },
      ...spriteLines,
      React.createElement('div', { style: { fontStyle: 'italic', fontWeight: focused ? 'bold' : 'normal', opacity: focused ? 1 : 0.5, color: focused ? color : undefined } }, companion.name),
    )
  }

  const bubbleContent = wrapText(reaction, 30).map((l, i) =>
    React.createElement('div', { key: i, style: { fontStyle: 'italic', opacity: fading ? 0.5 : 1, color: fading ? '#666' : undefined } }, l),
  )

  return React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', padding: '0 4px', flexDirection: 'row' } },
    React.createElement('div', { style: { border: `1px solid ${fading ? '#666' : color}`, borderRadius: 8, padding: '4px 8px', maxWidth: 200 } }, ...bubbleContent),
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } }, ...spriteLines,
      React.createElement('div', { style: { fontStyle: 'italic', fontWeight: focused ? 'bold' : 'normal' } }, companion.name),
    ),
  )
}
