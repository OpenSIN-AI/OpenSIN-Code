# Context-Router Implementation

**File:** context-router.ts  
**Version:** 1.0.0  
**Purpose:** Keyword-based context loading for OpenCode

---

## 🎯 Overview

This module implements the Context-Router pattern for OpenCode.
It analyzes user prompts and loads only relevant documentation files.

---

## 📦 Installation

No installation needed - this is a reference implementation.
Copy the logic into your OpenCode workflow.

---

## 🔧 Usage

### Basic Usage

```typescript
import { selectContext } from './context-router';

// Analyze user prompt
const userPrompt = "Create a login component with React and Tailwind";
const contextFiles = selectContext(userPrompt);

// Result: ['Agents.md', 'design_guidelines.md', 'ui_components.md']
```

### With Config Loading

```typescript
import { loadConfig, selectContext } from './context-router';

// Load router configuration
const config = await loadConfig('agents-instructions/context-router.json');

// Select context based on user input
const files = selectContext(userPrompt, config);
```

---

## 📋 API Reference

### `selectContext(userInput: string, config?: RouterConfig): string[]`

Analyzes user input and returns relevant context files.

**Parameters:**
- `userInput` - The user's prompt or question
- `config` - Optional router configuration (uses default if not provided)

**Returns:**
- Array of file paths to load

**Example:**
```typescript
const files = selectContext("Deploy with Docker");
// Returns: ['Agents.md', 'infrastructure_setup.md', 'deployment_flow.md']
```

### `loadConfig(path: string): Promise<RouterConfig>`

Loads the router configuration from a JSON file.

**Parameters:**
- `path` - Path to context-router.json

**Returns:**
- Router configuration object

---

## 🎨 Configuration Format

See `agents-instructions/context-router.json` for the full configuration.

### Module Structure

```typescript
interface ContextModule {
  id: string;           // Unique identifier
  name: string;         // Display name
  description: string;  // What this module covers
  triggers: string[];   // Keywords that activate this module
  files: string[];      // Files to load when triggered
  priority: number;     // Loading priority (1 = highest)
}
```

### Trigger Matching

- Case-insensitive matching
- Partial word matching (e.g., "dockerize" matches "docker")
- Multiple triggers can activate the same module

---

## 🚀 Advanced Features

### Combination Rules

When multiple modules are triggered, additional files can be loaded:

```json
{
  "combinationRules": [
    {
      "when": ["worker", "security"],
      "add": ["worker_security.md"]
    }
  ]
}
```

### Fallback Behavior

If no modules match:
1. Load default files only
2. Notify user
3. Suggest available modules

---

## 📊 Performance

- **Time Complexity:** O(n*m) where n = input length, m = triggers
- **Space Complexity:** O(k) where k = matched files
- **Caching:** Config is cached for 1 hour
- **Max Files:** 10 total files per request

---

## 🧪 Testing

### Unit Tests

```typescript
describe('Context Router', () => {
  test('matches design keywords', () => {
    const files = selectContext("Create a button component");
    expect(files).toContain('design_guidelines.md');
  });

  test('matches infrastructure keywords', () => {
    const files = selectContext("Deploy with Docker");
    expect(files).toContain('infrastructure_setup.md');
  });
});
```

---

## 📝 Implementation Notes

1. **Always include Agents.md** - It's loaded by default
2. **Remove duplicates** - Same file won't be loaded twice
3. **Respect priority** - Higher priority modules loaded first
4. **Limit file count** - Max 10 files to prevent context overflow

---

## 🔗 Integration with OpenCode

### Option 1: Pre-processing Hook

```typescript
// In your OpenCode workflow
const contextFiles = selectContext(userPrompt);
const contextContent = await loadFiles(contextFiles);
const enhancedPrompt = `${contextContent}\n\n${userPrompt}`;
```

### Option 2: MCP Server

Implement as Model Context Protocol server for dynamic loading.

---

**Last Updated:** 2026-02-02  
**Status:** ✅ READY FOR USE
