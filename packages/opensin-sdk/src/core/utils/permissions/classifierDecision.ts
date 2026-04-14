import { feature } from 'bun:bundle'
import { ASK_USER_QUESTION_TOOL_NAME } from '../../tools/AskUserQuestionTool/prompt'
import { ENTER_PLAN_MODE_TOOL_NAME } from '../../tools/EnterPlanModeTool/constants'
import { EXIT_PLAN_MODE_TOOL_NAME } from '../../tools/ExitPlanModeTool/constants'
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt'
import { GLOB_TOOL_NAME } from '../../tools/GlobTool/prompt'
import { GREP_TOOL_NAME } from '../../tools/GrepTool/prompt'
import { LIST_MCP_RESOURCES_TOOL_NAME } from '../../tools/ListMcpResourcesTool/prompt'
import { LSP_TOOL_NAME } from '../../tools/LSPTool/prompt'
import { SEND_MESSAGE_TOOL_NAME } from '../../tools/SendMessageTool/constants'
import { SLEEP_TOOL_NAME } from '../../tools/SleepTool/prompt'
import { TASK_CREATE_TOOL_NAME } from '../../tools/TaskCreateTool/constants'
import { TASK_GET_TOOL_NAME } from '../../tools/TaskGetTool/constants'
import { TASK_LIST_TOOL_NAME } from '../../tools/TaskListTool/constants'
import { TASK_OUTPUT_TOOL_NAME } from '../../tools/TaskOutputTool/constants'
import { TASK_STOP_TOOL_NAME } from '../../tools/TaskStopTool/prompt'
import { TASK_UPDATE_TOOL_NAME } from '../../tools/TaskUpdateTool/constants'
import { TEAM_CREATE_TOOL_NAME } from '../../tools/TeamCreateTool/constants'
import { TEAM_DELETE_TOOL_NAME } from '../../tools/TeamDeleteTool/constants'
import { TODO_WRITE_TOOL_NAME } from '../../tools/TodoWriteTool/constants'
import { TOOL_SEARCH_TOOL_NAME } from '../../tools/ToolSearchTool/prompt'
import { YOLO_CLASSIFIER_TOOL_NAME } from './yoloClassifier'

// Ant-only tool names: conditional require so Bun can DCE these in external builds.
// Gates mirror tools.ts. Keeps the tool name strings out of cli.js.
/* eslint-disable @typescript-eslint/no-require-imports */
const TERMINAL_CAPTURE_TOOL_NAME = feature('TERMINAL_PANEL')
  ? (
      require('../../tools/TerminalCaptureTool/prompt') as typeof import('../../tools/TerminalCaptureTool/prompt')
    ).TERMINAL_CAPTURE_TOOL_NAME
  : null
const OVERFLOW_TEST_TOOL_NAME = feature('OVERFLOW_TEST_TOOL')
  ? (
      require('../../tools/OverflowTestTool/OverflowTestTool') as typeof import('../../tools/OverflowTestTool/OverflowTestTool')
    ).OVERFLOW_TEST_TOOL_NAME
  : null
const VERIFY_PLAN_EXECUTION_TOOL_NAME =
  process.env.USER_TYPE === 'ant'
    ? (
        require('../../tools/VerifyPlanExecutionTool/constants') as typeof import('../../tools/VerifyPlanExecutionTool/constants')
      ).VERIFY_PLAN_EXECUTION_TOOL_NAME
    : null
const WORKFLOW_TOOL_NAME = feature('WORKFLOW_SCRIPTS')
  ? (
      require('../../tools/WorkflowTool/constants') as typeof import('../../tools/WorkflowTool/constants')
    ).WORKFLOW_TOOL_NAME
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Tools that are safe and don't need any classifier checking.
 * Used by the auto mode classifier to skip unnecessary API calls.
 * Does NOT include write/edit tools — those are handled by the
 * acceptEdits fast path (allowed in CWD, classified outside CWD).
 */
const SAFE_YOLO_ALLOWLISTED_TOOLS = new Set([
  // Read-only file operations
  FILE_READ_TOOL_NAME,
  // Search / read-only
  GREP_TOOL_NAME,
  GLOB_TOOL_NAME,
  LSP_TOOL_NAME,
  TOOL_SEARCH_TOOL_NAME,
  LIST_MCP_RESOURCES_TOOL_NAME,
  'ReadMcpResourceTool', // no exported constant
  // Task management (metadata only)
  TODO_WRITE_TOOL_NAME,
  TASK_CREATE_TOOL_NAME,
  TASK_GET_TOOL_NAME,
  TASK_UPDATE_TOOL_NAME,
  TASK_LIST_TOOL_NAME,
  TASK_STOP_TOOL_NAME,
  TASK_OUTPUT_TOOL_NAME,
  // Plan mode / UI
  ASK_USER_QUESTION_TOOL_NAME,
  ENTER_PLAN_MODE_TOOL_NAME,
  EXIT_PLAN_MODE_TOOL_NAME,
  // Swarm coordination (internal mailbox/team state only — teammates have
  // their own permission checks, so no actual security bypass).
  TEAM_CREATE_TOOL_NAME,
  // Agent cleanup
  TEAM_DELETE_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  // Workflow orchestration — subagents go through canUseTool individually
  ...(WORKFLOW_TOOL_NAME ? [WORKFLOW_TOOL_NAME] : []),
  // Misc safe
  SLEEP_TOOL_NAME,
  // Ant-only safe tools (gates mirror tools.ts)
  ...(TERMINAL_CAPTURE_TOOL_NAME ? [TERMINAL_CAPTURE_TOOL_NAME] : []),
  ...(OVERFLOW_TEST_TOOL_NAME ? [OVERFLOW_TEST_TOOL_NAME] : []),
  ...(VERIFY_PLAN_EXECUTION_TOOL_NAME ? [VERIFY_PLAN_EXECUTION_TOOL_NAME] : []),
  // Internal classifier tool
  YOLO_CLASSIFIER_TOOL_NAME,
])

export function isAutoModeAllowlistedTool(toolName: string): boolean {
  return SAFE_YOLO_ALLOWLISTED_TOOLS.has(toolName)
}
