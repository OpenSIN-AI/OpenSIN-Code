import { useEffect, useRef } from 'react'

interface NotificationOptions { key: string; message: string; priority?: string; timeoutMs?: number }
interface NotificationManager { addNotification: (opts: NotificationOptions) => void; removeNotification: (key: string) => void }

const mgr: NotificationManager = { addNotification: () => {}, removeNotification: () => {} }
export function setNotificationManager(manager: NotificationManager) { mgr.addNotification = manager.addNotification; mgr.removeNotification = manager.removeNotification }

export function isBuddyTeaserWindow(): boolean {
  const d = new Date()
  return d.getFullYear() === 2026 && d.getMonth() === 3 && d.getDate() <= 7
}

export function isBuddyLive(): boolean {
  const d = new Date()
  return d.getFullYear() > 2026 || (d.getFullYear() === 2026 && d.getMonth() >= 3)
}

export function useBuddyNotification(hasCompanion: boolean) {
  const shownRef = useRef(false)
  useEffect(() => {
    if (shownRef.current || hasCompanion || !isBuddyTeaserWindow()) return
    shownRef.current = true
    mgr.addNotification({ key: 'opensin-buddy-teaser', message: '/buddy — hatch your OpenSIN companion!', priority: 'immediate', timeoutMs: 15000 })
    return () => mgr.removeNotification('opensin-buddy-teaser')
  }, [hasCompanion])
}

export function findBuddyTriggerPositions(text: string): Array<{ start: number; end: number }> {
  const triggers: Array<{ start: number; end: number }> = []
  const re = /\/buddy\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) triggers.push({ start: m.index, end: m.index + m[0].length })
  return triggers
}

export function getBuddyEmotionForEvent(event: string): string {
  const map: Record<string, string> = { task_complete: 'happy', error: 'worried', long_task: 'focused', success: 'celebrating', idle: 'sleepy', achievement: 'proud', confusion: 'confused' }
  return map[event] || 'neutral'
}
