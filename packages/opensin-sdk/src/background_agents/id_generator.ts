/**
 * OpenSIN Background Agents — Readable ID Generator
 *
 * Generates human-readable delegation IDs like "swift-coral-researcher"
 * using adjective-color-animal combinations.
 *
 * Branded for OpenSIN/sincode ecosystem.
 */

const ADJECTIVES = [
  'swift', 'bold', 'calm', 'deep', 'fast', 'keen', 'lone', 'pure',
  'rare', 'safe', 'sure', 'true', 'vast', 'warm', 'wise', 'bright',
  'clear', 'dark', 'fair', 'free', 'full', 'grand', 'high', 'kind',
  'light', 'long', 'rich', 'soft', 'strong', 'thin', 'wild', 'young',
  'active', 'agile', 'brave', 'cool', 'eager', 'fine', 'good', 'hard',
  'lucky', 'neat', 'proud', 'quick', 'real', 'sharp', 'smart', 'solid',
];

const COLORS = [
  'coral', 'azure', 'amber', 'black', 'blond', 'brown', 'cream', 'gold',
  'green', 'ivory', 'khaki', 'lilac', 'mauve', 'olive', 'peach', 'pearl',
  'plum', 'rose', 'ruby', 'rust', 'sand', 'silver', 'snow', 'steel',
  'teal', 'topaz', 'violet', 'white', 'wheat', 'blaze', 'frost', 'mist',
];

const ANIMALS = [
  'researcher', 'explorer', 'builder', 'scout', 'pilot', 'guide', 'coder',
  'analyst', 'architect', 'engineer', 'designer', 'writer', 'tester',
  'reviewer', 'planner', 'solver', 'finder', 'maker', 'creator', 'hacker',
  'eagle', 'hawk', 'owl', 'fox', 'wolf', 'bear', 'lion', 'tiger',
  'shark', 'whale', 'dolphin', 'raven', 'falcon', 'cobra', 'lynx',
];

let idCounter = 0;

/**
 * Generate a readable delegation ID.
 * Format: adjective-color-animal (e.g. "swift-coral-researcher")
 */
export function generateDelegationId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  idCounter++;
  return `${adj}-${color}-${animal}-${idCounter}`;
}

/**
 * Reset the ID counter (useful for testing).
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Generate a short session ID.
 */
export function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'ses-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
