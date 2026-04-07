import { BuddySuggestion } from './types';

export function formatSuggestion(suggestion: BuddySuggestion): string {
  return `💡 ${suggestion.text} (confidence: ${(suggestion.confidence * 100).toFixed(0)}%)`;
}

export function formatSuggestions(suggestions: BuddySuggestion[]): string {
  if (suggestions.length === 0) {
    return 'No suggestions available.';
  }
  return suggestions.map((s, i) => `${i + 1}. ${formatSuggestion(s)}`).join('\n');
}
