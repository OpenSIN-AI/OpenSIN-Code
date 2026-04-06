import { ContentBlock, ConversationMessage, MessageRole, Session } from './session';

const COMPACT_CONTINUATION_PREAMBLE =
  'This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion of the conversation.\n\n';
const COMPACT_RECENT_MESSAGES_NOTE = 'Recent messages are preserved verbatim.';
const COMPACT_DIRECT_RESUME_INSTRUCTION =
  'Continue the conversation from where it left off without asking the user any further questions. Resume directly — do not acknowledge the summary, do not recap what was happening, and do not preface with continuation text.';

export interface CompactionConfig {
  preserveRecentMessages: number;
  maxEstimatedTokens: number;
}

export function createDefaultCompactionConfig(): CompactionConfig {
  return {
    preserveRecentMessages: 4,
    maxEstimatedTokens: 10_000,
  };
}

export interface CompactionResult {
  summary: string;
  formattedSummary: string;
  compactedSession: Session;
  removedMessageCount: number;
}

export function estimateSessionTokens(session: Session): number {
  return session.messages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);
}

export function shouldCompact(session: Session, config: CompactionConfig): boolean {
  const start = compactedSummaryPrefixLen(session);
  const compactable = session.messages.slice(start);

  return (
    compactable.length > config.preserveRecentMessages &&
    compactable.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0) >=
      config.maxEstimatedTokens
  );
}

export function formatCompactSummary(summary: string): string {
  const withoutAnalysis = stripTagBlock(summary, 'analysis');
  const content = extractTagBlock(withoutAnalysis, 'summary');
  
  if (content) {
    const formatted = withoutAnalysis.replace(
      `<summary>${content}</summary>`,
      `Summary:\n${content.trim()}`
    );
    return collapseBlankLines(formatted).trim();
  }

  return collapseBlankLines(withoutAnalysis).trim();
}

export function getCompactContinuationMessage(
  summary: string,
  suppressFollowUpQuestions: boolean,
  recentMessagesPreserved: boolean
): string {
  let base = `${COMPACT_CONTINUATION_PREAMBLE}${formatCompactSummary(summary)}`;

  if (recentMessagesPreserved) {
    base += '\n\n';
    base += COMPACT_RECENT_MESSAGES_NOTE;
  }

  if (suppressFollowUpQuestions) {
    base += '\n';
    base += COMPACT_DIRECT_RESUME_INSTRUCTION;
  }

  return base;
}

export function compactSession(session: Session, config: CompactionConfig): CompactionResult {
  if (!shouldCompact(session, config)) {
    return {
      summary: '',
      formattedSummary: '',
      compactedSession: session,
      removedMessageCount: 0,
    };
  }

  const existingSummary = extractExistingCompactedSummary(session.messages[0]);
  const compactedPrefixLen = existingSummary ? 1 : 0;
  const keepFrom = Math.max(0, session.messages.length - config.preserveRecentMessages);
  const removed = session.messages.slice(compactedPrefixLen, keepFrom);
  const preserved = session.messages.slice(keepFrom);
  
  const summary = mergeCompactSummaries(
    existingSummary || null,
    summarizeMessages(removed)
  );
  const formattedSummary = formatCompactSummary(summary);
  const continuation = getCompactContinuationMessage(summary, true, preserved.length > 0);

  const compactedMessages: ConversationMessage[] = [
    {
      role: MessageRole.System,
      blocks: [{ type: 'text', text: continuation }],
      usage: null,
    },
    ...preserved,
  ];

  return {
    summary,
    formattedSummary,
    compactedSession: {
      version: session.version,
      messages: compactedMessages,
    },
    removedMessageCount: removed.length,
  };
}

function compactedSummaryPrefixLen(session: Session): number {
  return session.messages.length > 0 && extractExistingCompactedSummary(session.messages[0])
    ? 1
    : 0;
}

function summarizeMessages(messages: ConversationMessage[]): string {
  const userMessages = messages.filter(m => m.role === MessageRole.User).length;
  const assistantMessages = messages.filter(m => m.role === MessageRole.Assistant).length;
  const toolMessages = messages.filter(m => m.role === MessageRole.Tool).length;

  const toolNames = [
    ...new Set(
      messages.flatMap(m =>
        m.blocks.flatMap(block => {
          if (block.type === 'toolUse') return [block.name];
          if (block.type === 'toolResult') return [block.toolName];
          return [];
        })
      )
    ),
  ];

  const lines: string[] = [
    '<summary>',
    'Conversation summary:',
    `- Scope: ${messages.length} earlier messages compacted (user=${userMessages}, assistant=${assistantMessages}, tool=${toolMessages}).`,
  ];

  if (toolNames.length > 0) {
    lines.push(`- Tools mentioned: ${toolNames.join(', ')}.`);
  }

  const recentUserRequests = collectRecentRoleSummaries(messages, MessageRole.User, 3);
  if (recentUserRequests.length > 0) {
    lines.push('- Recent user requests:');
    for (const request of recentUserRequests) {
      lines.push(`  - ${request}`);
    }
  }

  const pendingWork = inferPendingWork(messages);
  if (pendingWork.length > 0) {
    lines.push('- Pending work:');
    for (const item of pendingWork) {
      lines.push(`  - ${item}`);
    }
  }

  const keyFiles = collectKeyFiles(messages);
  if (keyFiles.length > 0) {
    lines.push(`- Key files referenced: ${keyFiles.join(', ')}.`);
  }

  const currentWork = inferCurrentWork(messages);
  if (currentWork) {
    lines.push(`- Current work: ${currentWork}`);
  }

  lines.push('- Key timeline:');
  for (const message of messages) {
    const role = message.role;
    const content = message.blocks.map(summarizeBlock).join(' | ');
    lines.push(`  - ${role}: ${content}`);
  }
  lines.push('</summary>');

  return lines.join('\n');
}

function mergeCompactSummaries(existingSummary: string | null, newSummary: string): string {
  if (!existingSummary) {
    return newSummary;
  }

  const previousHighlights = extractSummaryHighlights(existingSummary);
  const newFormattedSummary = formatCompactSummary(newSummary);
  const newHighlights = extractSummaryHighlights(newFormattedSummary);
  const newTimeline = extractSummaryTimeline(newFormattedSummary);

  const lines: string[] = ['<summary>', 'Conversation summary:'];

  if (previousHighlights.length > 0) {
    lines.push('- Previously compacted context:');
    for (const line of previousHighlights) {
      lines.push(`  ${line}`);
    }
  }

  if (newHighlights.length > 0) {
    lines.push('- Newly compacted context:');
    for (const line of newHighlights) {
      lines.push(`  ${line}`);
    }
  }

  if (newTimeline.length > 0) {
    lines.push('- Key timeline:');
    for (const line of newTimeline) {
      lines.push(`  ${line}`);
    }
  }

  lines.push('</summary>');
  return lines.join('\n');
}

function summarizeBlock(block: ContentBlock): string {
  let raw: string;
  switch (block.type) {
    case 'text':
      raw = block.text;
      break;
    case 'toolUse':
      raw = `tool_use ${block.name}(${block.input})`;
      break;
    case 'toolResult':
      raw = `tool_result ${block.toolName}: ${block.isError ? 'error ' : ''}${block.output}`;
      break;
  }
  return truncateSummary(raw, 160);
}

function collectRecentRoleSummaries(
  messages: ConversationMessage[],
  role: MessageRole,
  limit: number
): string[] {
  return messages
    .filter(m => m.role === role)
    .reverse()
    .map(m => firstTextBlock(m))
    .filter((t): t is string => t !== null)
    .slice(0, limit)
    .map(t => truncateSummary(t, 160))
    .reverse();
}

function inferPendingWork(messages: ConversationMessage[]): string[] {
  return messages
    .slice()
    .reverse()
    .map(m => firstTextBlock(m))
    .filter((t): t is string => t !== null)
    .filter(text => {
      const lowered = text.toLowerCase();
      return (
        lowered.includes('todo') ||
        lowered.includes('next') ||
        lowered.includes('pending') ||
        lowered.includes('follow up') ||
        lowered.includes('remaining')
      );
    })
    .slice(0, 3)
    .map(t => truncateSummary(t, 160))
    .reverse();
}

function collectKeyFiles(messages: ConversationMessage[]): string[] {
  const files = messages
    .flatMap(m => m.blocks)
    .flatMap(block => {
      switch (block.type) {
        case 'text':
          return [block.text];
        case 'toolUse':
          return [block.input];
        case 'toolResult':
          return [block.output];
      }
    })
    .flatMap(extractFileCandidates)
    .sort()
    .filter((file, index, arr) => index === 0 || file !== arr[index - 1])
    .slice(0, 8);

  return files;
}

function inferCurrentWork(messages: ConversationMessage[]): string | null {
  return messages
    .slice()
    .reverse()
    .map(m => firstTextBlock(m))
    .find((t): t is string => t !== null && t.trim().length > 0)
    ? truncateSummary(
        messages
          .slice()
          .reverse()
          .map(m => firstTextBlock(m))
          .find((t): t is string => t !== null && t.trim().length > 0)!,
        200
      )
    : null;
}

function firstTextBlock(message: ConversationMessage): string | null {
  for (const block of message.blocks) {
    if (block.type === 'text' && block.text.trim().length > 0) {
      return block.text;
    }
  }
  return null;
}

function hasInterestingExtension(candidate: string): boolean {
  const pathParts = candidate.split('/');
  const filename = pathParts[pathParts.length - 1];
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return false;
  
  const ext = filename.slice(dotIndex + 1).toLowerCase();
  return ['rs', 'ts', 'tsx', 'js', 'json', 'md'].includes(ext);
}

function extractFileCandidates(content: string): string[] {
  const candidates: string[] = [];
  const words = content.split(/\s+/);
  
  for (const token of words) {
    const candidate = token.replace(/[.,:;()"']/g, '');
    if (candidate.includes('/') && hasInterestingExtension(candidate)) {
      candidates.push(candidate);
    }
  }
  
  return candidates;
}

function truncateSummary(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }
  return content.slice(0, maxChars - 1) + '…';
}

function estimateMessageTokens(message: ConversationMessage): number {
  return message.blocks.reduce((sum, block) => {
    switch (block.type) {
      case 'text':
        return sum + Math.floor(block.text.length / 4) + 1;
      case 'toolUse':
        return sum + Math.floor((block.name.length + block.input.length) / 4) + 1;
      case 'toolResult':
        return sum + Math.floor((block.toolName.length + block.output.length) / 4) + 1;
    }
  }, 0);
}

function extractTagBlock(content: string, tag: string): string | null {
  const start = `<${tag}>`;
  const end = `</${tag}>`;
  const startIndex = content.indexOf(start);
  if (startIndex === -1) return null;
  
  const contentStart = startIndex + start.length;
  const endIndex = content.indexOf(end, contentStart);
  if (endIndex === -1) return null;
  
  return content.slice(contentStart, endIndex);
}

function stripTagBlock(content: string, tag: string): string {
  const start = `<${tag}>`;
  const end = `</${tag}>`;
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  
  if (startIndex === -1 || endIndex === -1) {
    return content;
  }
  
  const endTagEnd = endIndex + end.length;
  return content.slice(0, startIndex) + content.slice(endTagEnd);
}

function collapseBlankLines(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let lastBlank = false;
  
  for (const line of lines) {
    const isBlank = line.trim().length === 0;
    if (isBlank && lastBlank) {
      continue;
    }
    result.push(line);
    lastBlank = isBlank;
  }
  
  return result.join('\n');
}

function extractExistingCompactedSummary(message: ConversationMessage): string | null {
  if (message.role !== MessageRole.System) {
    return null;
  }

  const text = firstTextBlock(message);
  if (!text) return null;

  const summary = text.startsWith(COMPACT_CONTINUATION_PREAMBLE)
    ? text.slice(COMPACT_CONTINUATION_PREAMBLE.length)
    : text;

  const noteIndex = summary.indexOf(`\n\n${COMPACT_RECENT_MESSAGES_NOTE}`);
  const instructionIndex = summary.indexOf(`\n${COMPACT_DIRECT_RESUME_INSTRUCTION}`);

  let cleanSummary = summary;
  if (noteIndex !== -1) {
    cleanSummary = summary.slice(0, noteIndex);
  } else if (instructionIndex !== -1) {
    cleanSummary = summary.slice(0, instructionIndex);
  }

  return cleanSummary.trim();
}

function extractSummaryHighlights(summary: string): string[] {
  const lines: string[] = [];
  let inTimeline = false;

  for (const line of formatCompactSummary(summary).split('\n')) {
    const trimmed = line.trimEnd();
    
    if (trimmed.length === 0 || trimmed === 'Summary:' || trimmed === 'Conversation summary:') {
      continue;
    }
    if (trimmed === '- Key timeline:') {
      inTimeline = true;
      continue;
    }
    if (inTimeline) {
      continue;
    }
    
    lines.push(trimmed);
  }

  return lines;
}

function extractSummaryTimeline(summary: string): string[] {
  const lines: string[] = [];
  let inTimeline = false;

  for (const line of formatCompactSummary(summary).split('\n')) {
    const trimmed = line.trimEnd();
    
    if (trimmed === '- Key timeline:') {
      inTimeline = true;
      continue;
    }
    if (!inTimeline) {
      continue;
    }
    if (trimmed.length === 0) {
      break;
    }
    
    lines.push(trimmed);
  }

  return lines;
}

export function getCompactRecentMessagesNote(): string {
  return COMPACT_RECENT_MESSAGES_NOTE;
}

export function getCompactDirectResumeInstruction(): string {
  return COMPACT_DIRECT_RESUME_INSTRUCTION;
}