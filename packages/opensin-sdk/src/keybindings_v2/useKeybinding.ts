/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;
declare type KeyboardEvent = any;

import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyBinding, KeybindingContext, ResolvedBinding } from './types'
import { KeybindingResolver } from './resolver'
import { DEFAULT_KEYBINDINGS } from './defaultBindings'

interface UseKeybindingOptions { context?: KeybindingContext; customBindings?: KeyBinding[]; enabled?: boolean; onCommand?: (command: string, args?: Record<string, unknown>) => void }

export function useKeybinding(options: UseKeybindingOptions = {}) {
  const { context = 'global', customBindings = [], enabled = true, onCommand } = options
  const [resolver] = useState(() => new KeybindingResolver([...DEFAULT_KEYBINDINGS, ...customBindings]))
  const [pendingChord, setPendingChord] = useState<string | null>(null)
  const chordTimeoutRef = useRef<number | null>(null)
  const onCommandRef = useRef(onCommand)
  onCommandRef.current = onCommand

  useEffect(() => {
    if (!enabled) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as any)?.tagName?.toLowerCase(); if (targetTag === 'input' || targetTag === 'textarea') { if (context !== 'input') return }
      const modifiers: string[] = []
      if (e.ctrlKey) modifiers.push('Ctrl'); if (e.altKey) modifiers.push('Alt')
      if (e.metaKey) modifiers.push('Meta'); if (e.shiftKey) modifiers.push('Shift')
      const key = e.key; const keyStr = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key

      if (pendingChord) {
        const resolved = resolver.resolveChord(pendingChord, keyStr, context)
        if (resolved) { e.preventDefault(); onCommandRef.current?.(resolved.command, resolved.args); setPendingChord(null); if (chordTimeoutRef.current) { clearTimeout(chordTimeoutRef.current); chordTimeoutRef.current = null }; return }
        setPendingChord(null); if (chordTimeoutRef.current) { clearTimeout(chordTimeoutRef.current); chordTimeoutRef.current = null }
      }

      const resolved = resolver.resolve(keyStr, context)
      if (resolved) { e.preventDefault(); onCommandRef.current?.(resolved.command, resolved.args); return }
      if (resolver.isPartialMatch(keyStr, context)) {
        setPendingChord(keyStr); chordTimeoutRef.current = window.setTimeout(() => setPendingChord(null), 1000)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => { window.removeEventListener('keydown', handleKeyDown); if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current) }
  }, [resolver, context, enabled, pendingChord])

  const getBindingForCommand = useCallback((command: string): ResolvedBinding | null => {
    const bindings = resolver.getBindingsForContext(context)
    return bindings.find(b => b.command === command) ? { command, source: 'default' } : null
  }, [resolver, context])

  return { resolver, pendingChord, getBindingForCommand }
}
