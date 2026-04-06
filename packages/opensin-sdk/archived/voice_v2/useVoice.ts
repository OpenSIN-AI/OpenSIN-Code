import { useCallback, useEffect, useRef, useState } from 'react'
import type { VoiceConfig, VoiceState, VoiceTranscript, VoiceCommand, VoiceEvent } from './types.js'
import { DEFAULT_VOICE_CONFIG } from './types.js'

interface UseVoiceOptions { config?: Partial<VoiceConfig>; onTranscript?: (t: VoiceTranscript) => void; onCommand?: (cmd: string) => void; onError?: (err: string) => void }

export function useVoice(options: UseVoiceOptions = {}) {
  const { config: userConfig, onTranscript, onCommand, onError } = options
  const config = { ...DEFAULT_VOICE_CONFIG, ...userConfig }
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isFinal, setIsFinal] = useState(false)
  const [volume, setVolume] = useState(0)
  const [events, setEvents] = useState<VoiceEvent[]>([])
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const addEvent = useCallback((type: VoiceEvent['type'], data?: unknown) => {
    setEvents(prev => [...prev.slice(-50), { type, data, timestamp: Date.now() }])
  }, [])

  const startListening = useCallback(async () => {
    if (state !== 'idle') return
    setState('listening'); addEvent('start')
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) { setState('error'); onError?.('Speech recognition not supported'); return }
      const recognition = new SR(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = config.language
      recognition.onresult = (event: any) => {
        let interim = ''; let final = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript
          else interim += event.results[i][0].transcript
        }
        const text = final || interim; setTranscript(text); setIsFinal(!!final)
        const t: VoiceTranscript = { text, isFinal: !!final, confidence: event.results[event.results.length - 1]?.[0]?.confidence ?? 0, timestamp: Date.now() }
        onTranscript?.(t); addEvent('transcript', t)
        if (final && config.autoSend) stopListening()
      }
      recognition.onerror = (e: any) => { setState('error'); onError?.(`Recognition error: ${e.error}`); addEvent('error', e.error) }
      recognition.onend = () => { if (state === 'listening') { setState('idle'); addEvent('stop') } }
      recognition.start(); recognitionRef.current = recognition
      if (config.noiseSuppression) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } })
          streamRef.current = stream; const ac = new AudioContext(); audioContextRef.current = ac
          const source = ac.createMediaStreamSource(stream); const analyser = ac.createAnalyser(); analyser.fftSize = 256
          source.connect(analyser); analyserRef.current = analyser
        } catch { /* volume monitoring unavailable */ }
      }
    } catch (err: any) { setState('error'); onError?.(`Failed to start voice: ${err.message}`); addEvent('error', err.message) }
  }, [state, config, onTranscript, onError, addEvent])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
    setState('idle'); addEvent('stop')
  }, [addEvent])

  const processVoiceCommand = useCallback((text: string, commands: VoiceCommand[]) => {
    if (!config.voiceCommands) return false
    for (const cmd of commands) {
      const match = text.match(cmd.pattern)
      if (match) { cmd.handler(match); onCommand?.(cmd.action); addEvent('command', cmd.action); return true }
    }
    return false
  }, [config.voiceCommands, onCommand, addEvent])

  useEffect(() => { return () => { stopListening() } }, [stopListening])

  return { state, transcript, isFinal, volume, events, startListening, stopListening, processVoiceCommand, setTranscript }
}
