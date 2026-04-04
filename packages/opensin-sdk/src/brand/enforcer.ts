/**
 * Brand Enforcer — Validates all generated media against OpenSIN brand guidelines.
 * Ensures every image, video, and text content follows brand rules.
 */

import { OPENSIN_BRAND } from './guidelines.js'

export interface BrandViolation {
  severity: 'critical' | 'warning' | 'info'
  rule: string
  message: string
  suggestion: string
}

export interface BrandCheckResult {
  passed: boolean
  violations: BrandViolation[]
  score: number // 0-100
}

export class BrandEnforcer {
  private readonly brand = OPENSIN_BRAND

  /**
   * Check if generated text content follows brand voice guidelines.
   */
  checkText(content: string): BrandCheckResult {
    const violations: BrandViolation[] = []
    const lower = content.toLowerCase()

    // Check for banned words
    for (const word of this.brand.voice.bannedWords) {
      if (lower.includes(word.toLowerCase())) {
        violations.push({
          severity: 'warning',
          rule: 'banned-words',
          message: `Banned word detected: "${word}"`,
          suggestion: `Replace with a preferred word from the brand guidelines.`,
        })
      }
    }

    // Check message hierarchy
    const hasHook = content.length > 0
    const hasCTA = /visit|click|sign up|learn more|try|get started/i.test(content)
    if (!hasCTA) {
      violations.push({
        severity: 'warning',
        rule: 'message-hierarchy',
        message: 'No clear call-to-action found',
        suggestion: 'Add a single, clear CTA following the message hierarchy.',
      })
    }

    // Check tone (basic heuristic)
    if (content.split('\n').length < 2 && content.length > 500) {
      violations.push({
        severity: 'info',
        rule: 'readability',
        message: 'Content may be too dense — consider breaking into paragraphs',
        suggestion: 'Use shorter paragraphs for better readability.',
      })
    }

    return {
      passed: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      score: Math.max(0, 100 - violations.length * 15),
    }
  }

  /**
   * Check if an image generation prompt follows brand visual rules.
   */
  checkImagePrompt(prompt: string): BrandCheckResult {
    const violations: BrandViolation[] = []
    const lower = prompt.toLowerCase()

    // Check for prohibited elements
    if (/text|words|letters/i.test(lower) && !/no text/i.test(lower)) {
      violations.push({
        severity: 'critical',
        rule: 'no-text-in-images',
        message: 'Image prompt should not include text — text is added in post-production',
        suggestion: 'Add "no text in image" to the prompt.',
      })
    }

    // Check for brand colors
    if (!/green|#00bb7f|emerald/i.test(lower)) {
      violations.push({
        severity: 'info',
        rule: 'brand-colors',
        message: 'Brand primary color (green #00bb7f) not mentioned in prompt',
        suggestion: 'Include brand colors in the image prompt for consistency.',
      })
    }

    // Check for dark aesthetic
    if (!/dark|black|night|deep/i.test(lower)) {
      violations.push({
        severity: 'warning',
        rule: 'aesthetic',
        message: 'Dark aesthetic not specified — may generate bright/cheerful images',
        suggestion: 'Add "dark background, premium aesthetic" to the prompt.',
      })
    }

    return {
      passed: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      score: Math.max(0, 100 - violations.length * 20),
    }
  }

  /**
   * Generate a brand-compliant image prompt from a raw request.
   */
  enhanceImagePrompt(rawPrompt: string): string {
    const enhanced = rawPrompt.trim()
    // Remove any text requests
    const noText = enhanced.replace(/with text ["'].*?["']/gi, '').replace(/text ["'].*?["']/gi, '')
    // Append brand style suffix
    return `${noText.trim()}${this.brand.visualStyle.imagePromptSuffix}`
  }

  /**
   * Generate a brand-compliant video prompt from a raw request.
   */
  enhanceVideoPrompt(rawPrompt: string): string {
    const enhanced = rawPrompt.trim()
    const noText = enhanced.replace(/with text ["'].*?["']/gi, '').replace(/text ["'].*?["']/gi, '')
    return `${noText.trim()}${this.brand.visualStyle.videoPromptSuffix}`
  }

  /**
   * Generate a TTS narration script from content, following brand voice.
   */
  generateTTSScript(content: string): string {
    // Structure: Hook → Promise → Proof → CTA
    const lines = content.split('\n').filter(l => l.trim())
    if (lines.length === 0) return ''

    const hook = lines[0]
    const body = lines.slice(1, -1).join('. ')
    const cta = lines[lines.length - 1]

    return `${hook}. ${body}. ${cta}`
  }
}
