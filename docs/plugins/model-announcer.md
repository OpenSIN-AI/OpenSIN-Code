# Model Announcer Plugin

Injects model identity into the chat context so the LLM is self-aware.

## Why

Different models have different capabilities. By telling the model what it is, it can adjust its behavior accordingly.

## Usage

```typescript
import { createModelAnnouncer } from '@opensin/sdk';

const announcer = createModelAnnouncer();
announcer.setModel('gpt-4o');

// Get the announcement
const prompt = announcer.getAnnouncement();
// "You are running as gpt-4o (OpenAI). Capabilities: text, vision, function-calling, json-mode..."

// Inject into system prompt
const enhanced = announcer.injectIntoSystemPrompt(basePrompt);

// Check capabilities
announcer.isVisionCapable('gpt-4o');      // true
announcer.isToolUseCapable('gemini-2.0-flash'); // true
announcer.getContextWindow('claude-3-5-sonnet'); // 200000
```

## Known Models

The plugin includes metadata for: GPT-4o, GPT-4-turbo, GPT-3.5-turbo, Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku, Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash, DeepSeek Chat, DeepSeek Coder.
