# @opensin/sdk

TypeScript SDK for the OpenSIN A2A (Agent-to-Agent) protocol. Provides a typed client, session management, model/provider abstractions, and event streaming utilities.

## Installation

```bash
npm install @opensin/sdk
```

## Quick Start

```typescript
import { OpenSINClient } from "@opensin/sdk";

const client = new OpenSINClient({
  baseUrl: "https://api.opensin.io",
  apiKey: process.env.OPENSIN_API_KEY,
});

// Register a provider
client.registerProvider({
  name: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

// Connect
await client.connect();

// Create a session
const session = client.createSession({
  systemPrompt: "You are a helpful assistant.",
});

// Send a prompt
const response = await client.prompt("Hello, what can you do?");
console.log(response.content);

// Stream a response
const stream = client.stream("Tell me a story about TypeScript.");
for await (const chunk of stream) {
  process.stdout.write(chunk.delta.text);
  if (chunk.done) console.log("\n--- Done ---");
}

// Disconnect
await client.disconnect();
```

## API Reference

### OpenSINClient

The main client class for interacting with the OpenSIN protocol.

```typescript
const client = new OpenSINClient({
  baseUrl: string,
  apiKey?: string,
  timeout?: number,
  retries?: number,
  headers?: Record<string, string>,
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Establish connection to the server |
| `disconnect()` | Close the connection |
| `createSession(config?)` | Create a new session |
| `getSession(id)` | Get a session by ID |
| `closeSession(id)` | Close a session |
| `prompt(request)` | Send a non-streaming prompt |
| `stream(request)` | Stream a response |
| `registerProvider(config)` | Register an AI provider |
| `setProvider(name)` | Set the active provider |

### Session Management

```typescript
import { SessionManager, createSessionId } from "@opensin/sdk";

const manager = new SessionManager();

const session = manager.create({
  id: createSessionId(),
  model: "gpt-4o",
  systemPrompt: "You are helpful.",
});

manager.list();       // All sessions
manager.get(id);      // Get by ID
manager.close(id);    // Close session
manager.delete(id);   // Remove session
```

### Event System

```typescript
import { EventEmitter, EventStream } from "@opensin/sdk";

const emitter = new EventEmitter();

// Listen for events
emitter.on("message", (event) => {
  console.log("Got message:", event.data);
});

// One-time listener
emitter.once("stream:end", (event) => {
  console.log("Stream finished");
});

// Emit events
emitter.emit({
  type: "message",
  data: { text: "Hello" },
  timestamp: new Date().toISOString(),
});
```

### Providers

```typescript
import { OpenAIProvider, AnthropicProvider, ProviderRegistry } from "@opensin/sdk";

const registry = new ProviderRegistry();

registry.register(new OpenAIProvider({
  name: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
}));

registry.register(new AnthropicProvider({
  name: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-sonnet-4-20250514",
}));

await registry.connectAll();
```

### Event Streaming

```typescript
import { EventStream, streamSSE } from "@opensin/sdk";

// Create an event stream
const stream = new EventStream();

stream.on("message", (event) => {
  console.log(event.data);
});

stream.push({
  type: "message",
  data: { text: "chunk" },
  timestamp: new Date().toISOString(),
});

// SSE parsing
const response = await fetch("/api/stream");
for await (const { event, data } of streamSSE(response)) {
  console.log(event, JSON.parse(data));
}
```

## Types

All types are exported for full TypeScript support:

```typescript
import type {
  AcpMessage,
  Session,
  PromptRequest,
  PromptResponse,
  StreamChunk,
  ModelInfo,
  ProviderConfig,
  ToolDefinition,
  ConnectionStatus,
  EventType,
} from "@opensin/sdk";
```

## Error Handling

```typescript
import {
  OpenSinError,
  ConnectionError,
  SessionError,
  ProviderError,
  StreamError,
} from "@opensin/sdk";

try {
  await client.connect();
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error("Connection failed:", error.message);
  } else if (error instanceof OpenSinError) {
    console.error(`Error [${error.code}]:`, error.message);
  }
}
```

## License

MIT
