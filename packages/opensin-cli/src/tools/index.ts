import { ToolDefinition } from '../core/types.js';
import { BashTool } from './bash.js';
import { ReadTool } from './read.js';
import { WriteTool } from './write.js';
import { EditTool } from './edit.js';
import { GrepTool } from './grep.js';
import { GlobTool } from './glob.js';
import { WebFetchTool } from './web_fetch.js';
import { WebSearchTool } from './web_search.js';
import { TodoWriteTool } from './todo_write.js';
import { WorktreeTool } from './worktree.js';
import { PlanModeTool } from './plan_mode.js';

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor() {
    this.registerBuiltInTools();
  }

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string) {
    this.tools.delete(name);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolDescriptions() {
    return this.getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  private registerBuiltInTools() {
    this.register(new BashTool());
    this.register(new ReadTool());
    this.register(new WriteTool());
    this.register(new EditTool());
    this.register(new GrepTool());
    this.register(new GlobTool());
    this.register(new WebFetchTool());
    this.register(new WebSearchTool());
    this.register(new TodoWriteTool());
    this.register(new WorktreeTool());
    this.register(new PlanModeTool());
  }
}

export { BashTool } from './bash.js';
export { ReadTool } from './read.js';
export { WriteTool } from './write.js';
export { EditTool } from './edit.js';
export { GrepTool } from './grep.js';
export { GlobTool } from './glob.js';
export { WebFetchTool } from './web_fetch.js';
export { WebSearchTool } from './web_search.js';
export { TodoWriteTool } from './todo_write.js';
export { WorktreeTool } from './worktree.js';
export { PlanModeTool } from './plan_mode.js';
