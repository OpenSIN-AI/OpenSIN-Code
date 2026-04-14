/* eslint-disable @typescript-eslint/no-explicit-any */
declare type AbortSignal = any;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DiffData, HookResult, MemoryUsage, SearchState, TaskItem, TerminalSize, TypeaheadOption, VirtualScrollItem, ScheduledTask } from './types'

export function useApiKeyVerification(apiKey?: string): HookResult<boolean> {
  const [loading, setLoading] = useState(false); const [error, setError] = useState<Error | null>(null); const [valid, setValid] = useState<boolean | null>(null)
  useEffect(() => { if (!apiKey) { setValid(false); return } setLoading(true); const timer = setTimeout(() => { const isValid = apiKey.length >= 20 && apiKey.startsWith('sk-'); setValid(isValid); setLoading(false); if (!isValid) setError(new Error('Invalid API key format')) }, 300); return () => clearTimeout(timer) }, [apiKey])
  return { data: valid, loading, error }
}

export function useAssistantHistory(limit = 50) {
  const [history, setHistory] = useState<string[]>([]); const [index, setIndex] = useState(-1)
  const addEntry = useCallback((entry: string) => { setHistory(prev => [entry, ...prev.slice(0, limit - 1)]); setIndex(-1) }, [limit])
  const navigate = useCallback((dir: 'prev' | 'next') => { setIndex(prev => dir === 'prev' ? Math.min(prev + 1, history.length - 1) : Math.max(prev - 1, -1)) }, [history.length])
  return { history, current: index >= 0 ? history[index] : '', addEntry, navigate, hasHistory: history.length > 0 }
}

export function useBackgroundTaskNavigation() {
  const [tasks, setTasks] = useState<Map<string, { status: string; progress: number }>>(new Map())
  const navigate = useCallback((id: string) => tasks.get(id) || null, [tasks])
  const updateTask = useCallback((id: string, status: string, progress: number) => { setTasks(prev => new Map(prev).set(id, { status, progress })) }, [])
  return { tasks, navigate, updateTask }
}

export function useCancelRequest() {
  const [isPending, setIsPending] = useState(false); const controllerRef = useRef<AbortController | null>(null)
  const start = useCallback(() => { controllerRef.current = new AbortController(); setIsPending(true); return controllerRef.current.signal }, [])
  const cancel = useCallback(() => { controllerRef.current?.abort(); controllerRef.current = null; setIsPending(false) }, [])
  return { isPending, start, cancel, signal: controllerRef.current?.signal }
}

export function useCommandQueue() {
  const [queue, setQueue] = useState<Array<{ id: string; command: string; args: unknown[] }>>([]); const [processing, setProcessing] = useState(false)
  const enqueue = useCallback((command: string, ...args: unknown[]) => { const id = Math.random().toString(36).slice(2); setQueue(prev => [...prev, { id, command, args }]); return id }, [])
  const dequeue = useCallback(() => setQueue(prev => prev.slice(1)), [])
  return { queue, current: queue[0] || null, processing, enqueue, dequeue, isEmpty: queue.length === 0 }
}

export function useCopyOnSelect(enabled = true) {
  useEffect(() => { if (!enabled) return; const handler = () => { const s = window.getSelection()?.toString(); if (s) navigator.clipboard?.writeText(s).catch(() => {}) }; document.addEventListener('mouseup', handler); return () => document.removeEventListener('mouseup', handler) }, [enabled])
}

export function useDiffData(original: string, modified: string): DiffData[] {
  return useMemo(() => {
    const ol = original.split('\n'); const ml = modified.split('\n'); const diffs: DiffData[] = []
    for (let i = 0; i < Math.max(ol.length, ml.length); i++) {
      const o = ol[i]; const m = ml[i]
      if (o === m) diffs.push({ type: 'unchanged', line: i + 1, content: m ?? o ?? '', oldLine: i + 1 })
      else { if (o !== undefined) diffs.push({ type: 'removed', line: i + 1, content: o, oldLine: i + 1 }); if (m !== undefined) diffs.push({ type: 'added', line: i + 1, content: m, oldLine: o ? i + 1 : undefined }) }
    }
    return diffs
  }, [original, modified])
}

export function useElapsedTime(isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0); const startTimeRef = useRef<number | null>(null)
  useEffect(() => { if (isRunning && !startTimeRef.current) startTimeRef.current = Date.now(); else if (!isRunning) { startTimeRef.current = null; setElapsed(0) } }, [isRunning])
  useEffect(() => { if (!isRunning || !startTimeRef.current) return; const timer = setInterval(() => setElapsed(Date.now() - (startTimeRef.current ?? Date.now())), 100); return () => clearInterval(timer) }, [isRunning])
  const formatTime = useCallback((ms: number) => { const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60); if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`; if (m > 0) return `${m}m ${s % 60}s`; return `${s}s` }, [])
  return { elapsed, formatted: formatTime(elapsed), isRunning }
}

export function useHistorySearch(history: string[]) {
  const [state, setState] = useState<SearchState>({ query: '', results: [], selectedIndex: 0, isSearching: false })
  const setQuery = useCallback((query: string) => { setState(prev => { if (!query) return { query: '', results: history, selectedIndex: 0, isSearching: false }; const results = history.filter(h => h.toLowerCase().includes(query.toLowerCase())); return { query, results, selectedIndex: 0, isSearching: true } }) }, [history])
  const selectNext = useCallback(() => setState(prev => ({ ...prev, selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1) })), [])
  const selectPrev = useCallback(() => setState(prev => ({ ...prev, selectedIndex: Math.max(prev.selectedIndex - 1, 0) })), [])
  return { ...state, setQuery, selectNext, selectPrev, selected: state.results[state.selectedIndex] }
}

export function useMemoryUsage(intervalMs = 5000): MemoryUsage | null {
  const [usage, setUsage] = useState<MemoryUsage | null>(null)
  useEffect(() => { const check = () => { if (typeof performance !== 'undefined' && 'memory' in performance) { const m = (performance as any).memory; setUsage({ rss: m.totalJSHeapSize, heapUsed: m.usedJSHeapSize, heapTotal: m.totalJSHeapSize, external: 0 }) } }; check(); const timer = setInterval(check, intervalMs); return () => clearInterval(timer) }, [intervalMs])
  return usage
}

export function usePromptSuggestion(context: string) {
  const suggestions = useMemo(() => {
    const map: Record<string, string[]> = { coding: ['Write a function to...', 'Refactor this code...', 'Add error handling...'], debugging: ['Find the bug in...', 'Why is this failing...', 'Trace the execution...'], writing: ['Summarize this text...', 'Rewrite more clearly...', 'Check grammar...'], analysis: ['Analyze this data...', 'Compare these options...', 'What are the tradeoffs...'] }
    return map[context] ?? ['Ask me anything...', 'Help me with...']
  }, [context])
  const [ci, setCi] = useState(0)
  return { suggestions, current: suggestions[ci], next: () => setCi(i => (i + 1) % suggestions.length), prev: () => setCi(i => (i - 1 + suggestions.length) % suggestions.length) }
}

export function useRemoteSession() {
  const [connected, setConnected] = useState(false); const [sessionId, setSessionId] = useState<string | null>(null); const [error, setError] = useState<string | null>(null)
  const connect = useCallback(async (url: string) => { try { setConnected(true); setSessionId(Math.random().toString(36).slice(2)) } catch (e: any) { setError(e.message); setConnected(false) } }, [])
  const disconnect = useCallback(() => { setConnected(false); setSessionId(null) }, [])
  return { connected, sessionId, error, connect, disconnect }
}

export function useScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const addTask = useCallback((cronExpression: string, command: string) => { const t: ScheduledTask = { id: Math.random().toString(36).slice(2), cronExpression, command, enabled: true }; setTasks(prev => [...prev, t]); return t.id }, [])
  const removeTask = useCallback((id: string) => setTasks(prev => prev.filter(t => t.id !== id)), [])
  const toggleTask = useCallback((id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t)), [])
  return { tasks, addTask, removeTask, toggleTask }
}

export function useSessionBackgrounding() {
  const [bg, setBg] = useState<Map<string, { name: string; timestamp: number }>>(new Map())
  const background = useCallback((id: string, name: string) => setBg(prev => new Map(prev).set(id, { name, timestamp: Date.now() })), [])
  const restore = useCallback((id: string) => setBg(prev => { const n = new Map(prev); n.delete(id); return n }), [])
  return { backgroundedSessions: bg, background, restore, count: bg.size }
}

export function useTasksV2() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const addTask = useCallback((content: string, priority = 0) => { const t: TaskItem = { id: Math.random().toString(36).slice(2), content, status: 'pending', priority }; setTasks(prev => [...prev, t]); return t.id }, [])
  const updateTask = useCallback((id: string, updates: Partial<TaskItem>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)), [])
  const removeTask = useCallback((id: string) => setTasks(prev => prev.filter(t => t.id !== id)), [])
  const clearCompleted = useCallback(() => setTasks(prev => prev.filter(t => t.status !== 'completed')), [])
  return { tasks, activeTasks: tasks.filter(t => t.status === 'active'), pendingTasks: tasks.filter(t => t.status === 'pending'), completedTasks: tasks.filter(t => t.status === 'completed'), addTask, updateTask, removeTask, clearCompleted }
}

export function useTerminalSize(): TerminalSize {
  const [size, setSize] = useState<TerminalSize>({ columns: 80, rows: 24 })
  useEffect(() => { const update = () => setSize({ columns: process.stdout?.columns ?? 80, rows: process.stdout?.rows ?? 24 }); update(); process.stdout?.on('resize', update); window.addEventListener('resize', update); return () => { process.stdout?.off('resize', update); window.removeEventListener('resize', update) } }, [])
  return size
}

export function useTextInput(initialValue = '') {
  const [value, setValue] = useState(initialValue); const [cursorPos, setCursorPos] = useState(initialValue.length)
  const [history, setHistory] = useState<string[]>([initialValue]); const [historyIndex, setHistoryIndex] = useState(0)
  const insert = useCallback((text: string) => { setValue(prev => { const before = prev.slice(0, cursorPos); const after = prev.slice(cursorPos); const nv = before + text + after; setCursorPos(p => p + text.length); return nv }) }, [cursorPos])
  const backspace = useCallback(() => { if (cursorPos === 0) return; setValue(prev => { const nv = prev.slice(0, cursorPos - 1) + prev.slice(cursorPos); setCursorPos(p => p - 1); return nv }) }, [cursorPos])
  const delete_ = useCallback(() => { if (cursorPos >= value.length) return; setValue(prev => prev.slice(0, cursorPos) + prev.slice(cursorPos + 1)) }, [cursorPos, value.length])
  const moveCursor = useCallback((delta: number) => setCursorPos(prev => Math.max(0, Math.min(prev + delta, value.length))), [value.length])
  const submit = useCallback(() => { setHistory(prev => [...prev, value]); setHistoryIndex(history.length); return value }, [value, history.length])
  const historyNav = useCallback((dir: 'up' | 'down') => { if (dir === 'up' && historyIndex > 0) { setHistoryIndex(i => i - 1); setValue(history[historyIndex - 1] ?? '') } else if (dir === 'down' && historyIndex < history.length - 1) { setHistoryIndex(i => i + 1); setValue(history[historyIndex + 1] ?? '') } }, [history, historyIndex])
  return { value, cursorPos, history, insert, backspace, delete: delete_, moveCursor, submit, historyNav, setValue, setCursorPos }
}

export function useTurnDiffs() {
  const [turnDiffs, setTurnDiffs] = useState<Map<number, DiffData[]>>(new Map())
  const addTurnDiff = useCallback((turn: number, diffs: DiffData[]) => setTurnDiffs(prev => new Map(prev).set(turn, diffs)), [])
  const getTurnDiff = useCallback((turn: number) => turnDiffs.get(turn) ?? [], [turnDiffs])
  return { turnDiffs, addTurnDiff, getTurnDiff, hasDiffs: turnDiffs.size > 0 }
}

export function useTypeahead(options: TypeaheadOption[], minChars = 2) {
  const [query, setQuery] = useState(''); const [selectedIndex, setSelectedIndex] = useState(0); const [isOpen, setIsOpen] = useState(false)
  const filtered = useMemo(() => { if (query.length < minChars) return []; const q = query.toLowerCase(); return options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)) }, [options, query, minChars])
  const select = useCallback((index: number) => { const o = filtered[index]; if (o) { setQuery(o.label); setIsOpen(false) } }, [filtered])
  const navigate = useCallback((dir: 'up' | 'down') => setSelectedIndex(prev => dir === 'up' ? Math.max(0, prev - 1) : Math.min(filtered.length - 1, prev + 1)), [filtered.length])
  return { query, setQuery, filtered, selectedIndex, isOpen, setIsOpen, select, navigate, selected: filtered[selectedIndex] }
}

export function useVirtualScroll(items: VirtualScrollItem[], containerHeight: number, overscan = 5) {
  const [scrollTop, setScrollTop] = useState(0)
  const { visibleStart, visibleEnd, totalHeight, offsetY } = useMemo(() => {
    let total = 0; let start = 0; let end = 0; let foundStart = false
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!; const itemBottom = total + item.height
      if (!foundStart && itemBottom >= scrollTop) { start = Math.max(0, i - overscan); foundStart = true }
      if (foundStart && total >= scrollTop + containerHeight) { end = Math.min(items.length, i + overscan + 1); break }
      total = itemBottom
    }
    if (!foundStart) { start = 0; end = 0 }; if (end === 0) end = items.length
    let offset = 0; for (let i = 0; i < start; i++) offset += items[i]!.height
    return { visibleStart: start, visibleEnd: end, totalHeight: total, offsetY: offset }
  }, [items, scrollTop, containerHeight, overscan])
  const visibleItems = useMemo(() => items.slice(visibleStart, visibleEnd).map((item, i) => ({ ...item, index: visibleStart + i })), [items, visibleStart, visibleEnd])
  return { visibleItems, totalHeight, offsetY, setScrollTop }
}
