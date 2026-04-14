// Union of all concrete task state types
// Use this for components that need to work with any task type

import type { DreamTaskState } from './DreamTask/DreamTask'
import type { InProcessTeammateTaskState } from './InProcessTeammateTask/types'
import type { LocalAgentTaskState } from './LocalAgentTask/LocalAgentTask'
import type { LocalShellTaskState } from './LocalShellTask/guards'
import type { LocalWorkflowTaskState } from './LocalWorkflowTask/LocalWorkflowTask'
import type { MonitorMcpTaskState } from './MonitorMcpTask/MonitorMcpTask'
import type { RemoteAgentTaskState } from './RemoteAgentTask/RemoteAgentTask'

export type TaskState =
  | LocalShellTaskState
  | LocalAgentTaskState
  | RemoteAgentTaskState
  | InProcessTeammateTaskState
  | LocalWorkflowTaskState
  | MonitorMcpTaskState
  | DreamTaskState

// Task types that can appear in the background tasks indicator
export type BackgroundTaskState =
  | LocalShellTaskState
  | LocalAgentTaskState
  | RemoteAgentTaskState
  | InProcessTeammateTaskState
  | LocalWorkflowTaskState
  | MonitorMcpTaskState
  | DreamTaskState

/**
 * Check if a task should be shown in the background tasks indicator.
 * A task is considered a background task if:
 * 1. It is running or pending
 * 2. It has been explicitly backgrounded (not a foreground task)
 */
export function isBackgroundTask(task: TaskState): task is BackgroundTaskState {
  if (task.status !== 'running' && task.status !== 'pending') {
    return false
  }
  // Foreground tasks (isBackgrounded === false) are not yet "background tasks"
  if ('isBackgrounded' in task && task.isBackgrounded === false) {
    return false
  }
  return true
}
