export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceConfig {
  enabled: boolean; pushToTalkKey: string; language: string; autoSend: boolean
  voiceCommands: boolean; noiseSuppression: boolean; echoCancellation: boolean
  volumeThreshold: number; silenceTimeout: number
}

export interface VoiceTranscript { text: string; isFinal: boolean; confidence: number; timestamp: number }
export interface VoiceCommand { pattern: RegExp; action: string; description: string; handler: (match: RegExpMatchArray) => void }
export interface VoiceEvent { type: 'start' | 'stop' | 'transcript' | 'command' | 'error'; data?: unknown; timestamp: number }

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  enabled: false, pushToTalkKey: 'Space', language: 'en-US', autoSend: false,
  voiceCommands: true, noiseSuppression: true, echoCancellation: true,
  volumeThreshold: 0.01, silenceTimeout: 1500,
}
