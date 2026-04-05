/**
 * StructuredDiff — Syntax-highlighted diff viewer
 */
import React from 'react';

interface DiffLine { type: 'add' | 'remove' | 'context'; content: string; lineNumber?: number }
interface StructuredDiffProps { lines: DiffLine[]; language?: string }

export const StructuredDiff: React.FC<StructuredDiffProps> = ({ lines, language }) => (
  <div className={`structured-diff language-${language || 'text'}`}>
    {lines.map((line, i) => (
      <div key={i} className={`diff-line diff-${line.type}`}>
        <span className="diff-indicator">{line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}</span>
        <span className="diff-content">{line.content}</span>
      </div>
    ))}
  </div>
);
