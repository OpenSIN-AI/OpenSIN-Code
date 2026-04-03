import { SubAgentMention } from "./types.js";

const MENTION_PATTERN = /@([\w-]+)/g;

export function extractMentions(text: string): SubAgentMention[] {
  const mentions: SubAgentMention[] = [];
  let match: RegExpExecArray | null;

  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    const name = match[1] ?? "";
    mentions.push({
      agentId: name,
      agentName: name,
      position: match.index,
      text: match[0],
    });
  }

  return mentions;
}

export function hasMention(text: string): boolean {
  return MENTION_PATTERN.test(text);
}

export function removeMentions(text: string): string {
  return text.replace(MENTION_PATTERN, "").replace(/\s+/g, " ").trim();
}

export function getMentionAtPosition(
  text: string,
  cursorPosition: number,
): SubAgentMention | null {
  const mentions = extractMentions(text);

  for (const mention of mentions) {
    const mentionEnd = mention.position + mention.text.length;
    if (cursorPosition >= mention.position && cursorPosition <= mentionEnd) {
      return mention;
    }
  }

  return null;
}

export function getMentionPrefix(
  text: string,
  cursorPosition: number,
): string | null {
  if (cursorPosition === 0) return null;

  const textBeforeCursor = text.substring(0, cursorPosition);
  const atIndex = textBeforeCursor.lastIndexOf("@");

  if (atIndex === -1) return null;

  const afterAt = textBeforeCursor.substring(atIndex + 1);

  if (/[^a-zA-Z0-9_-]/.test(afterAt)) return null;

  if (
    atIndex > 0 &&
    !/[\s\n]/.test(textBeforeCursor.charAt(atIndex - 1))
  ) {
    return null;
  }

  return afterAt;
}

export function replaceMentionWithAgent(
  text: string,
  mention: SubAgentMention,
  agentName: string,
): string {
  const before = text.substring(0, mention.position);
  const after = text.substring(mention.position + mention.text.length);
  return `${before}@${agentName}${after}`;
}

export function insertMention(
  text: string,
  position: number,
  agentName: string,
): string {
  const before = text.substring(0, position);
  const after = text.substring(position);
  return `${before}@${agentName} ${after}`;
}
