import type { VoiceConfig } from './types.js'

export function isVoiceModeSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

export function isVoiceModeEnabled(config?: Partial<VoiceConfig>): boolean {
  if (!isVoiceModeSupported()) return false
  return config?.enabled ?? false
}

export function getVoiceModeStatus(config: VoiceConfig): string {
  if (!isVoiceModeSupported()) return 'Not supported in this browser'
  if (!config.enabled) return 'Disabled'
  return `Ready — push-to-talk: ${config.pushToTalkKey}`
}
