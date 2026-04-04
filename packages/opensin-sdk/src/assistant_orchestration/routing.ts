/**
 * OpenSIN Task Router
 *
 * Routes tasks to the most suitable available assistant based on configurable
 * rules, scoring functions, and routing strategies.
 */

import type {
  AssistantId,
  AssistantState,
  TaskDescription,
  RoutingRule,
  RoutingDecision,
} from './types.js'

export class TaskRouter {
  private rules: Map<string, RoutingRule> = new Map()
  private strategy: string

  constructor(strategy: string = 'scored') {
    this.strategy = strategy
  }

  addRule(rule: RoutingRule): void {
    this.rules.set(rule.id, rule)
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
  }

  getRules(): RoutingRule[] {
    return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority)
  }

  async route(
    task: TaskDescription,
    available: AssistantState[]
  ): Promise<RoutingDecision> {
    if (available.length === 0) {
      throw new Error('No available assistants to route to')
    }

    switch (this.strategy) {
      case 'round_robin':
        return this.roundRobin(task, available)
      case 'least_loaded':
        return this.leastLoaded(task, available)
      case 'role_based':
        return this.roleBased(task, available)
      case 'scored':
      default:
        return this.scored(task, available)
    }
  }

  private roundRobin(task: TaskDescription, available: AssistantState[]): RoutingDecision {
    const sorted = [...available].sort((a, b) => a.taskHistory.length - b.taskHistory.length)
    const selected = sorted[0]!
    return {
      taskId: task.id,
      selectedAssistantId: selected.config.id,
      reason: 'Round-robin: least tasks assigned',
      alternativeIds: sorted.slice(1).map((a) => a.config.id),
      scoredAt: Date.now(),
    }
  }

  private leastLoaded(task: TaskDescription, available: AssistantState[]): RoutingDecision {
    const scored = available.map((assistant) => ({
      assistant,
      score: this.computeLoadScore(assistant),
    }))
    scored.sort((a, b) => a.score - b.score)
    const selected = scored[0]!
    return {
      taskId: task.id,
      selectedAssistantId: selected.assistant.config.id,
      reason: `Least loaded: score=${selected.score}`,
      alternativeIds: scored.slice(1).map((s) => s.assistant.config.id),
      scoredAt: Date.now(),
    }
  }

  private roleBased(task: TaskDescription, available: AssistantState[]): RoutingDecision {
    if (task.requiredRole) {
      const matching = available.filter((a) => a.config.role === task.requiredRole)
      if (matching.length > 0) {
        const selected = matching[0]!
        return {
          taskId: task.id,
          selectedAssistantId: selected.config.id,
          reason: `Role match: ${task.requiredRole}`,
          alternativeIds: matching.slice(1).map((a) => a.config.id),
          scoredAt: Date.now(),
        }
      }
    }

    const selected = available[0]!
    return {
      taskId: task.id,
      selectedAssistantId: selected.config.id,
      reason: task.requiredRole
        ? `No role match for ${task.requiredRole}, fallback to first available`
        : 'No role requirement, first available',
      alternativeIds: available.slice(1).map((a) => a.config.id),
      scoredAt: Date.now(),
    }
  }

  private scored(task: TaskDescription, available: AssistantState[]): RoutingDecision {
    const sortedRules = this.getRules()
    const candidates = available.map((assistant) => {
      let totalScore = 0
      let reasonParts: string[] = []

      for (const rule of sortedRules) {
        if (rule.condition(task, available)) {
          const score = rule.score(task, assistant)
          totalScore += score
          reasonParts.push(`${rule.name}=${score}`)
        }
      }

      if (sortedRules.length === 0) {
        totalScore = this.computeDefaultScore(task, assistant)
        reasonParts.push('default_scoring')
      }

      return { assistant, score: totalScore, reason: reasonParts.join(', ') }
    })

    candidates.sort((a, b) => b.score - a.score)
    const selected = candidates[0]!

    return {
      taskId: task.id,
      selectedAssistantId: selected.assistant.config.id,
      reason: selected.reason || 'Default scoring',
      alternativeIds: candidates.slice(1).map((c) => c.assistant.config.id),
      scoredAt: Date.now(),
    }
  }

  private computeLoadScore(assistant: AssistantState): number {
    let score = assistant.taskHistory.length
    if (assistant.status === 'busy') score += 10
    if (assistant.status === 'paused') score += 5
    return score
  }

  private computeDefaultScore(task: TaskDescription, assistant: AssistantState): number {
    let score = 50

    if (task.requiredRole && assistant.config.role === task.requiredRole) {
      score += 30
    }

    const loadPenalty = assistant.taskHistory.length * 5
    score -= loadPenalty

    if (assistant.status === 'idle') score += 10

    const freshness = Date.now() - assistant.lastActiveAt
    if (freshness < 60_000) score += 5

    return score
  }
}

export function createDefaultRouter(strategy: string = 'scored'): TaskRouter {
  const router = new TaskRouter(strategy)

  router.addRule({
    id: 'role-match',
    name: 'Role Match',
    priority: 100,
    condition: (task) => !!task.requiredRole,
    score: (task, assistant) => (task.requiredRole === assistant.config.role ? 30 : 0),
  })

  router.addRule({
    id: 'tool-match',
    name: 'Tool Match',
    priority: 90,
    condition: (task) => !!task.requiredTools && task.requiredTools!.length > 0,
    score: (task, assistant) => {
      if (!task.requiredTools || !assistant.config.tools) return 0
      const matchCount = task.requiredTools.filter((t) => assistant.config.tools!.includes(t)).length
      return (matchCount / task.requiredTools.length) * 25
    },
  })

  router.addRule({
    id: 'load-balance',
    name: 'Load Balance',
    priority: 80,
    condition: () => true,
    score: (_, assistant) => Math.max(0, 20 - assistant.taskHistory.length * 3),
  })

  return router
}
