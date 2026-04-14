import type { Tool } from '../../Tool'
import { AgentTool } from '../AgentTool/AgentTool'
import { BashTool } from '../BashTool/BashTool'
import { FileEditTool } from '../FileEditTool/FileEditTool'
import { FileReadTool } from '../FileReadTool/FileReadTool'
import { FileWriteTool } from '../FileWriteTool/FileWriteTool'
import { GlobTool } from '../GlobTool/GlobTool'
import { GrepTool } from '../GrepTool/GrepTool'
import { NotebookEditTool } from '../NotebookEditTool/NotebookEditTool'

let _primitiveTools: readonly Tool[] | undefined

/**
 * Primitive tools hidden from direct model use when REPL mode is on
 * (REPL_ONLY_TOOLS) but still accessible inside the REPL VM context.
 * Exported so display-side code (collapseReadSearch, renderers) can
 * classify/render virtual messages for these tools even when they're
 * absent from the filtered execution tools list.
 *
 * Lazy getter — the import chain collapseReadSearch.ts → primitiveTools.ts
 * → FileReadTool.tsx → ... loops back through the tool registry, so a
 * top-level const hits "Cannot access before initialization". Deferring
 * to call time avoids the TDZ.
 *
 * Referenced directly rather than via getAllBaseTools() because that
 * excludes Glob/Grep when hasEmbeddedSearchTools() is true.
 */
export function getReplPrimitiveTools(): readonly Tool[] {
  return (_primitiveTools ??= [
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GlobTool,
    GrepTool,
    BashTool,
    NotebookEditTool,
    AgentTool,
  ])
}
