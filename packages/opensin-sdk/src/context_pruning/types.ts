/**
 * OpenSIN Context Pruning Types
 */

export interface PruningPolicy {
  maxToolOutputLines: number;
  maxMessageAge: number;
  pruneStaleOutputs: boolean;
  summarizeBeforePrune: boolean;
}

export const DEFAULT_PRUNING_POLICY: PruningPolicy = {
  maxToolOutputLines: 100,
  maxMessageAge: 50,
  pruneStaleOutputs: true,
  summarizeBeforePrune: false,
};

export interface PruningStats {
  messagesPruned: number;
  tokensSaved: number;
  lastPrunedAt: Date;
}
