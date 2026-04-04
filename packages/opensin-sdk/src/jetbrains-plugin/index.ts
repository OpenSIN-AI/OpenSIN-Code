/**
 * JetBrains IDE Plugin — Full IDE support like Windsurf/Kilo Code
 *
 * Provides comprehensive JetBrains IDE integration with:
 * - JSON-RPC protocol for IDE communication
 * - Plugin lifecycle management
 * - Document/editor/project APIs
 * - Event subscription system
 */

export { ProtocolClient, ProtocolSerializer, METHODS, PROTOCOL_VERSION } from "./protocol.js";
export type { ProtocolClient as ProtocolClientType } from "./protocol.js";

export { LifecycleManager } from "./lifecycle.js";
export type { LifecycleManager as LifecycleManagerType } from "./lifecycle.js";

export { DocumentManager } from "./document.js";
export type { DocumentManager as DocumentManagerType } from "./document.js";

export { EditorManager } from "./editor.js";
export type { EditorManager as EditorManagerType } from "./editor.js";

export { ProjectManager } from "./project.js";
export type { ProjectManager as ProjectManagerType } from "./project.js";

export type {
  JetBrainsPluginInfo,
  JetBrainsConnectionConfig,
  JetBrainsDocumentInfo,
  JetBrainsEditorState,
  JetBrainsProjectInfo,
  JetBrainsModuleInfo,
  JetBrainsTerminalState,
  JetBrainsActionRequest,
  JetBrainsActionResponse,
  JetBrainsNotification,
  JetBrainsToolWindow,
  JetBrainsProtocolMessage,
  JetBrainsProtocolResponse,
  JetBrainsEventType,
  JetBrainsEvent,
  JetBrainsFileChange,
  JetBrainsLifecycleState,
} from "./types.js";

export class JetBrainsPlugin {
  private lifecycle: LifecycleManager;
  private documents: DocumentManager;
  private editor: EditorManager;
  private project: ProjectManager;

  constructor(client: ProtocolClient) {
    this.lifecycle = new LifecycleManager(client);
    this.documents = new DocumentManager(client);
    this.editor = new EditorManager(client);
    this.project = new ProjectManager(client);
  }

  get lifecycleManager(): LifecycleManager {
    return this.lifecycle;
  }

  get documentManager(): DocumentManager {
    return this.documents;
  }

  get editorManager(): EditorManager {
    return this.editor;
  }

  get projectManager(): ProjectManager {
    return this.project;
  }
}
