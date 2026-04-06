import { ToolDefinition } from '../core/types.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export class TodoWriteTool implements ToolDefinition {
  name = 'todo_write';
  description = 'Create, update, and track todos/tasks. Use to manage task lists.';
  parameters = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['create', 'update', 'list', 'delete', 'complete'], description: 'Action to perform' },
      id: { type: 'string', description: 'Todo ID (for update/delete/complete)' },
      content: { type: 'string', description: 'Todo content' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
    },
    required: ['action'],
  };

  private todoFile = join(process.cwd(), '.opensin', 'todos.json');

  private async loadTodos(): Promise<Array<Record<string, any>>> {
    try {
      const data = await readFile(this.todoFile, 'utf-8');
      return JSON.parse(data);
    } catch { return []; }
  }

  private async saveTodos(todos: Array<Record<string, any>>): Promise<void> {
    await mkdir(join(process.cwd(), '.opensin'), { recursive: true });
    await writeFile(this.todoFile, JSON.stringify(todos, null, 2));
  }

  async execute(input: Record<string, unknown>): Promise<{ output: string; isError?: boolean }> {
    const { action, id, content, priority = 'medium' } = input as Record<string, any>;
    const todos = await this.loadTodos();

    switch (action) {
      case 'create': {
        const todo = { id: `todo_${Date.now()}`, content, priority, status: 'pending', createdAt: new Date().toISOString() };
        todos.push(todo);
        await this.saveTodos(todos);
        return { output: `Created todo: ${todo.id} - ${content}` };
      }
      case 'update': {
        const idx = todos.findIndex((t) => t.id === id);
        if (idx === -1) return { output: `Todo not found: ${id}`, isError: true };
        if (content) todos[idx].content = content;
        if (priority) todos[idx].priority = priority;
        await this.saveTodos(todos);
        return { output: `Updated todo: ${id}` };
      }
      case 'complete': {
        const idx = todos.findIndex((t) => t.id === id);
        if (idx === -1) return { output: `Todo not found: ${id}`, isError: true };
        todos[idx].status = 'completed';
        todos[idx].completedAt = new Date().toISOString();
        await this.saveTodos(todos);
        return { output: `Completed todo: ${id}` };
      }
      case 'delete': {
        const idx = todos.findIndex((t) => t.id === id);
        if (idx === -1) return { output: `Todo not found: ${id}`, isError: true };
        todos.splice(idx, 1);
        await this.saveTodos(todos);
        return { output: `Deleted todo: ${id}` };
      }
      case 'list': {
        if (todos.length === 0) return { output: 'No todos' };
        const lines = todos.map((t) => `[${t.status === 'completed' ? 'x' : ' '}] ${t.id} (${t.priority}) ${t.content}`);
        return { output: `Todos:\n${lines.join('\n')}` };
      }
      default:
        return { output: `Unknown action: ${action}`, isError: true };
    }
  }
}
