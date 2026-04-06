export enum PermissionMode {
  ReadOnly = 'readOnly',
  WorkspaceWrite = 'workspaceWrite',
  DangerFullAccess = 'dangerFullAccess',
}

export type PermissionPromptDecision =
  | { type: 'allow' }
  | { type: 'deny'; reason: string };

export interface PermissionRequest {
  toolName: string;
  input: string;
}

export interface PermissionPrompter {
  decide(request: PermissionRequest): PermissionPromptDecision;
}

export type PermissionOutcome =
  | { type: 'allow' }
  | { type: 'deny'; reason: string };

export class PermissionPolicy {
  private mode: PermissionMode;

  constructor(mode: PermissionMode = PermissionMode.WorkspaceWrite) {
    this.mode = mode;
  }

  static new(mode: PermissionMode): PermissionPolicy {
    return new PermissionPolicy(mode);
  }

  authorize(
    toolName: string,
    input: string,
    prompter?: PermissionPrompter | undefined
  ): PermissionOutcome {
    if (this.mode === PermissionMode.DangerFullAccess) {
      return { type: 'allow' };
    }

    if (prompter) {
      const decision = prompter.decide({ toolName, input });
      if (decision.type === 'deny') {
        return { type: 'deny', reason: decision.reason };
      }
      return { type: 'allow' };
    }

    if (this.mode === PermissionMode.WorkspaceWrite) {
      return { type: 'allow' };
    }

    return { type: 'deny', reason: 'Permission denied' };
  }

  getMode(): PermissionMode {
    return this.mode;
  }
}

export class AlwaysAllowPrompter implements PermissionPrompter {
  decide(_request: PermissionRequest): PermissionPromptDecision {
    return { type: 'allow' };
  }
}

export class AlwaysDenyPrompter implements PermissionPrompter {
  constructor(private reason: string = 'denied');
  decide(_request: PermissionRequest): PermissionPromptDecision {
    return { type: 'deny', reason: this.reason };
  }
}