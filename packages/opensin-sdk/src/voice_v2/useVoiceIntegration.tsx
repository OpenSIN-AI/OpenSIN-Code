import { useCallback, useEffect, useMemo, useState } from 'react'
import type { VoiceConfig, VoiceState, VoiceTranscript, VoiceCommand } from './types.js'
import { DEFAULT_VOICE_CONFIG } from './types.js'
import { useVoice } from './useVoice.js'
import { isVoiceModeEnabled } from './voiceModeEnabled.js'

const BUILTIN_COMMANDS: VoiceCommand[] = [
  { pattern: /^(?:cancel|stop|abort)$/i, action: 'cancel', description: 'Cancel current operation', handler: () => {} },
  { pattern: /^(?:clear|clear screen)$/i, action: 'clear', description: 'Clear the screen', handler: () => {} },
  { pattern: /^(?:help|what can i say)$/i, action: 'help', description: 'Show voice help', handler: () => {} },
  { pattern: /^(?:send|go|submit)$/i, action: 'send', description: 'Send the transcript', handler: () => {} },
  { pattern: /^(?:repeat|say again)$/i, action: 'repeat', description: 'Repeat last response', handler: () => {} },
  { pattern: /^(?:scroll up|page up)$/i, action: 'scroll_up', description: 'Scroll up', handler: () => {} },
  { pattern: /^(?:scroll down|page down)$/i, action: 'scroll_down', description: 'Scroll down', handler: () => {} },
]

interface VoiceIntegrationProps { config?: Partial<VoiceConfig>; onSend?: (text: string) => void; onCommand?: (cmd: string) => void; customCommands?: VoiceCommand[] }

export function useVoiceIntegration(props: VoiceIntegrationProps = {}) {
  const { config: userConfig, onSend, onCommand, customCommands = [] } = props
  const [isEnabled, setIsEnabled] = useState(() => isVoiceModeEnabled(userConfig))
  const [isHoldingTalk, setIsHoldingTalk] = useState(false)
  const [displayTranscript, setDisplayTranscript] = useState('')
  const commands = useMemo(() => [...BUILTIN_COMMANDS, ...customCommands], [customCommands])

  const { state, transcript, isFinal, volume, events, startListening, stopListening, processVoiceCommand } = useVoice({
    config: userConfig,
    onTranscript: (t: VoiceTranscript) => setDisplayTranscript(t.text),
    onCommand: (cmd: string) => onCommand?.(cmd),
  })

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isEnabled) return
    const pushKey = userConfig?.pushToTalkKey || DEFAULT_VOICE_CONFIG.pushToTalkKey
    if (e.code === pushKey || e.key === pushKey) { e.preventDefault(); setIsHoldingTalk(true); startListening() }
  }, [isEnabled, userConfig, startListening])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isHoldingTalk) return
    const pushKey = userConfig?.pushToTalkKey || DEFAULT_VOICE_CONFIG.pushToTalkKey
    if (e.code === pushKey || e.key === pushKey) {
      e.preventDefault(); setIsHoldingTalk(false)
      if (transcript && onSend) onSend(transcript)
      stopListening()
    }
  }, [isHoldingTalk, transcript, onSend, userConfig, stopListening])

  useEffect(() => { window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp) } }, [handleKeyDown, handleKeyUp])

  return {
    state: state as VoiceState, isEnabled, isHoldingTalk, transcript: displayTranscript, isFinal, volume, events,
    toggleEnabled: () => setIsEnabled(p => !p), startListening, stopListening,
    sendTranscript: () => { if (transcript && onSend) { onSend(transcript); setDisplayTranscript('') } },
    processCommand: (text: string) => processVoiceCommand(text, commands),
  }
}
