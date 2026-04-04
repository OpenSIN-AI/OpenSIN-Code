/**
 * Content Pipeline — End-to-end branded content generation.
 *
 * Workflow: Brief → Script → Generate → TTS → Subtitles → Package → Review → Publish
 *
 * Implements the 2026 enterprise AI content best practices:
 * - Brand system first, templates second
 * - Message hierarchy (Hook → Promise → Proof → CTA)
 * - Packaging layer preserves brand identity
 * - One source, many platform variants
 */

import { OPENSIN_BRAND } from './guidelines.js'
import { BrandEnforcer } from './enforcer.js'
import { MediaPackager } from './packager.js'

export interface ContentBrief {
  topic: string
  audience: string
  keyMessage: string // One sentence the viewer should remember
  channel: 'blog' | 'youtube' | 'tiktok' | 'instagram' | 'linkedin' | 'twitter'
  format: 'article' | 'video' | 'image' | 'carousel'
  tone?: string
  cta?: string
}

export interface GeneratedContent {
  script: string
  images: { path: string; prompt: string }[]
  video?: { path: string; prompt: string }
  tts?: { audioBase64: string; duration: number }
  subtitles?: string
  packaged: { path: string }[]
  brandScore: number
}

export class ContentPipeline {
  private readonly brand = OPENSIN_BRAND
  private readonly enforcer = new BrandEnforcer()
  private readonly packager = new MediaPackager()

  /**
   * Full pipeline: brief → generate → package → review
   */
  async execute(brief: ContentBrief, geminiApiKey: string): Promise<GeneratedContent> {
    console.log(`[Pipeline] Starting: ${brief.topic} for ${brief.channel}`)

    // Step 1: Generate script following brand voice
    console.log('[Pipeline] Step 1: Generating script...')
    const script = await this.generateScript(brief, geminiApiKey)

    // Step 2: Generate images with brand-compliant prompts
    console.log('[Pipeline] Step 2: Generating images...')
    const images = await this.generateImages(brief, geminiApiKey)

    // Step 3: Generate video if requested
    let video: { path: string; prompt: string } | undefined
    if (brief.format === 'video' || brief.channel === 'youtube' || brief.channel === 'tiktok') {
      console.log('[Pipeline] Step 3: Generating video...')
      video = await this.generateVideo(brief, geminiApiKey)
    }

    // Step 4: Generate TTS narration
    console.log('[Pipeline] Step 4: Generating TTS narration...')
    const tts = await this.packager.generateTTS(script, geminiApiKey)

    // Step 5: Generate subtitles
    console.log('[Pipeline] Step 5: Generating subtitles...')
    const subtitles = this.packager.generateSubtitles(script)

    // Step 6: Package everything with brand
    console.log('[Pipeline] Step 6: Packaging with brand...')
    const packaged = await this.packageAll(images, video, script, subtitles, geminiApiKey)

    // Step 7: Brand review
    console.log('[Pipeline] Step 7: Brand review...')
    const brandCheck = this.enforcer.checkText(script)

    console.log(`[Pipeline] Complete! Brand score: ${brandCheck.score}/100`)

    return {
      script,
      images,
      video,
      tts,
      subtitles,
      packaged,
      brandScore: brandCheck.score,
    }
  }

  private async generateScript(brief: ContentBrief, apiKey: string): Promise<string> {
    const tone = brief.tone || this.brand.voice.channelTone[brief.channel]
    const cta = brief.cta || `Visit opensin.ai to learn more`

    const prompt = `Write content for OpenSIN AI following these brand guidelines:

Brand: ${this.brand.name} — ${this.brand.tagline}
Topic: ${brief.topic}
Audience: ${brief.audience}
Key Message: ${brief.keyMessage}
Channel: ${brief.channel}
Tone: ${tone}

Message Hierarchy (MUST follow this order):
1. HOOK: Grab attention in the first line
2. PROMISE: What OpenSIN delivers
3. PROOF: Evidence, metrics, or demonstration
4. CTA: ${cta}

Brand Voice Rules:
- Tone: ${this.brand.voice.tone}
- Use preferred words: ${this.brand.voice.preferredWords.join(', ')}
- NEVER use banned words: ${this.brand.voice.bannedWords.join(', ')}
- Language: English
- Keep it ${brief.channel === 'twitter' ? 'under 280 characters' : brief.channel === 'tiktok' ? 'under 150 words' : 'comprehensive'}

Write the content now:`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const data: any = await response.json()
    if (data.error) throw new Error(`Script generation failed: ${data.error.message}`)

    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  private async generateImages(brief: ContentBrief, apiKey: string): Promise<{ path: string; prompt: string }[]> {
    const rawPrompt = `A professional image for OpenSIN AI blog post about: ${brief.topic}. ${brief.keyMessage}`
    const enhancedPrompt = this.enforcer.enhanceImagePrompt(rawPrompt)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    )

    const data: any = await response.json()
    if (data.error) throw new Error(`Image generation failed: ${data.error.message}`)

    const parts = data.candidates?.[0]?.content?.parts || []
    const images: { path: string; prompt: string }[] = []

    for (const part of parts) {
      if (part.inlineData?.data) {
        const path = `/tmp/opensin-${Date.now()}-${images.length}.png`
        images.push({ path, prompt: enhancedPrompt })
      }
    }

    return images
  }

  private async generateVideo(brief: ContentBrief, apiKey: string): Promise<{ path: string; prompt: string }> {
    const rawPrompt = `A cinematic video about OpenSIN AI: ${brief.topic}. ${brief.keyMessage}`
    const enhancedPrompt = this.enforcer.enhanceVideoPrompt(rawPrompt)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: { durationSeconds: 8, aspectRatio: '16:9' },
        }),
      }
    )

    const data: any = await response.json()
    if (data.error) throw new Error(`Video generation failed: ${data.error.message}`)

    return { path: data.name || '', prompt: enhancedPrompt }
  }

  private async packageAll(
    images: { path: string; prompt: string }[],
    video: { path: string; prompt: string } | undefined,
    script: string,
    subtitles: string,
    apiKey: string
  ): Promise<{ path: string }[]> {
    const packaged: { path: string }[] = []

    // Package images with logo
    for (const img of images) {
      const result = await this.packager.package({
        type: 'image',
        inputPath: img.path,
        outputPath: img.path.replace('.png', '-branded.png'),
        title: this.brand.fullName,
        addLogo: true,
      })
      if (result.success) packaged.push({ path: result.outputPath })
    }

    // Package video with full branding
    if (video) {
      const result = await this.packager.package({
        type: 'video',
        inputPath: video.path,
        outputPath: video.path.replace('.mp4', '-branded.mp4'),
        narrationScript: script,
        addLogo: true,
        addSubtitles: true,
        addBGM: true,
        addEndCard: true,
        platform: 'youtube',
      })
      if (result.success) packaged.push({ path: result.outputPath })
    }

    return packaged
  }
}
