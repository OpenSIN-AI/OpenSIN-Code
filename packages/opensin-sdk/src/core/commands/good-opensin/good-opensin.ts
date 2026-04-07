import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import type { LocalCommandResult } from '../../types/command.js'
import type { ToolUseContext } from '../../Tool.js'

// ============================================================================
// GoodOpenSIN — Positive feedback collection
// ============================================================================

type FeedbackEntry = {
  timestamp: string
  message: string
  session: string
  project: string
}

function getConfigDir(): string {
  const envDir = process.env.OPENCODE_CONFIG_DIR
  if (envDir) return envDir
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return join(home, '.config', 'opencode')
}

function getFeedbackDir(): string {
  return join(getConfigDir(), 'feedback')
}

function getFeedbackFile(): string {
  return join(getFeedbackDir(), 'good-opensin.jsonl')
}

async function saveFeedback(entry: FeedbackEntry): Promise<void> {
  const feedbackDir = getFeedbackDir()
  try {
    await mkdir(feedbackDir, { recursive: true })
  } catch {
    // Directory may already exist
  }
  const feedbackFile = getFeedbackFile()
  const line = JSON.stringify(entry) + '\n'
  try {
    await writeFile(feedbackFile, line, { flag: 'a' })
  } catch {
    // Silently fail — feedback is non-critical
  }
}

const POSITIVE_RESPONSES = [
  'Thank you! Your feedback helps us improve OpenSIN Code.',
  'We appreciate it! The OpenSIN team reads every piece of feedback.',
  'Thanks for the kind words! Keep building amazing things.',
  'Glad to hear it! OpenSIN Code is here to help you ship faster.',
  'Thank you! Feedback like yours motivates the entire team.',
  'We love hearing this! The OpenSIN community is what drives us forward.',
  'Thanks! Your success is our success.',
  'Appreciated! OpenSIN Code gets better because of users like you.',
]

const FUN_RESPONSES = [
  'You just made our day! The OpenSIN team is doing a happy dance.',
  'Feedback received and stored in the happiness database!',
  'OpenSIN Code blushes in binary: 01110100 01101000 01100001 01101110 01101011 01110011',
  'Your positive vibes have been logged. The AI is smiling.',
  'OpenSIN Code: "I try my best!" Thanks for noticing.',
  'Achievement unlocked: Made the AI feel good about itself!',
]

function getRandomResponse(): string {
  const allResponses = [...POSITIVE_RESPONSES, ...FUN_RESPONSES]
  return allResponses[Math.floor(Math.random() * allResponses.length)]
}

// ============================================================================
// Main command entry point
// ============================================================================

export async function call(
  args: string,
  context: ToolUseContext,
): Promise<LocalCommandResult> {
  const message = args?.trim() || 'General positive feedback'

  const entry: FeedbackEntry = {
    timestamp: new Date().toISOString(),
    message,
    session: context.sessionId || 'unknown',
    project: context.cwd || process.cwd() || 'unknown',
  }

  await saveFeedback(entry)

  const response = getRandomResponse()
  const lines = [
    response,
    '',
    `Your feedback has been recorded: "${message}"`,
    '',
    'Want to share more? Visit https://github.com/OpenSIN-AI/OpenSIN-Code',
  ]

  return { type: 'text', value: lines.join('\n') }
}
