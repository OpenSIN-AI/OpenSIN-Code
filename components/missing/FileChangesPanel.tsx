/**
 * FileChangesPanel — Overview of all file changes with diff preview
 */
import React, { useState } from 'react';

interface FileChange { path: string; additions: number; deletions: number; status: 'added' | 'modified' | 'deleted' }
interface FileChangesPanelProps { changes: FileChange[]; onAccept?: (path: string) => void; onReject?: (path: string) => void }

export const FileChangesPanel: React.FC<FileChangesPanelProps> = ({ changes, onAccept, onReject }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalAdditions = changes.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = changes.reduce((sum, c) => sum + c.deletions, 0);

  return (
    <div className="file-changes-panel">
      <div className="file-changes-summary">
        <span>{changes.length} files changed</span>
        <span className="additions">+{totalAdditions}</span>
        <span className="deletions">-{totalDeletions}</span>
      </div>
      {changes.map((change) => (
        <div key={change.path} className="file-change-item">
          <div className="file-change-header" onClick={() => setExpanded(expanded === change.path ? null : change.path)}>
            <span className={`file-status file-${change.status}`}>{change.status}</span>
            <span className="file-path">{change.path}</span>
            <span className="file-stats">+{change.additions} -{change.deletions}</span>
          </div>
          {expanded === change.path && (
            <div className="file-change-diff">
              {/* Diff preview would go here */}
              <div className="diff-placeholder">Diff preview for {change.path}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
