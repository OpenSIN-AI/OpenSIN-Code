import { HookDefinition, HookEvent } from './types.js';

export class HookRegistry {
  private hooks: Map<HookEvent, HookDefinition[]> = new Map();

  register(hook: HookDefinition): void {
    const eventHooks = this.hooks.get(hook.event) || [];
    eventHooks.push(hook);
    eventHooks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this.hooks.set(hook.event, eventHooks);
  }

  unregister(id: string): boolean {
    for (const [event, hooks] of this.hooks) {
      const index = hooks.findIndex(h => h.id === id);
      if (index !== -1) {
        hooks.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  getHooks(event: HookEvent): HookDefinition[] {
    return this.hooks.get(event) || [];
  }

  getAll(): HookDefinition[] {
    const all: HookDefinition[] = [];
    for (const hooks of this.hooks.values()) {
      all.push(...hooks);
    }
    return all;
  }

  clear(): void {
    this.hooks.clear();
  }
}
