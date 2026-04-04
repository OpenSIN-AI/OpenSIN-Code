import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const TOOLS_DIR = path.resolve(__dirname, '../tools_v2');
const INDEX_PATH = path.join(TOOLS_DIR, 'index.ts');
const TOOLS_TS_PATH = path.join(TOOLS_DIR, 'tools.ts');
const TYPES_PATH = path.join(TOOLS_DIR, 'types.ts');

function readIndexContent(): string {
  return fs.readFileSync(INDEX_PATH, 'utf-8');
}

function readToolsTs(): string {
  return fs.readFileSync(TOOLS_TS_PATH, 'utf-8');
}

function readTypesTs(): string {
  return fs.readFileSync(TYPES_PATH, 'utf-8');
}

function readToolFile(toolDir: string): string {
  const indexPath = path.join(TOOLS_DIR, toolDir, 'index.ts');
  if (fs.existsSync(indexPath)) return fs.readFileSync(indexPath, 'utf-8');
  const tsPath = path.join(TOOLS_DIR, toolDir, toolDir + '.ts');
  if (fs.existsSync(tsPath)) return fs.readFileSync(tsPath, 'utf-8');
  const tsxPath = path.join(TOOLS_DIR, toolDir, toolDir + '.tsx');
  if (fs.existsSync(tsxPath)) return fs.readFileSync(tsxPath, 'utf-8');
  return '';
}

describe('Tools v2 Module', () => {
  describe('Module exports', () => {
    it('should have an index.ts file', () => {
      expect(fs.existsSync(INDEX_PATH)).toBe(true);
    });

    it('should export BashTool', () => {
      const content = readIndexContent();
      expect(content).toContain('BashTool');
    });

    it('should export FileReadTool', () => {
      const content = readIndexContent();
      expect(content).toContain('FileReadTool');
    });

    it('should export FileWriteTool', () => {
      const content = readIndexContent();
      expect(content).toContain('FileWriteTool');
    });

    it('should export FileEditTool', () => {
      const content = readIndexContent();
      expect(content).toContain('FileEditTool');
    });

    it('should export GrepTool', () => {
      const content = readIndexContent();
      expect(content).toContain('GrepTool');
    });

    it('should export GlobTool', () => {
      const content = readIndexContent();
      expect(content).toContain('GlobTool');
    });

    it('should export MCPTool', () => {
      const content = readIndexContent();
      expect(content).toContain('MCPTool');
    });

    it('should export SkillTool', () => {
      const content = readIndexContent();
      expect(content).toContain('SkillTool');
    });

    it('should export TaskCreateTool', () => {
      const content = readIndexContent();
      expect(content).toContain('TaskCreateTool');
    });

    it('should export WebFetchTool', () => {
      const content = readIndexContent();
      expect(content).toContain('WebFetchTool');
    });
  });

  describe('Tool schema validation', () => {
    it('types.ts should export ToolDefinition interface', () => {
      const content = readTypesTs();
      expect(content).toContain('ToolDefinition');
    });

    it('types.ts should export ToolResult interface', () => {
      const content = readTypesTs();
      expect(content).toContain('ToolResult');
    });

    it('types.ts should export ToolCall interface', () => {
      const content = readTypesTs();
      expect(content).toContain('ToolCall');
    });

    it('ToolDefinition should require name field', () => {
      const content = readTypesTs();
      expect(content).toMatch(/name:\s*string/);
    });

    it('ToolDefinition should require description field', () => {
      const content = readTypesTs();
      expect(content).toMatch(/description:\s*string/);
    });

    it('ToolDefinition should require inputSchema field', () => {
      const content = readTypesTs();
      expect(content).toContain('inputSchema');
    });

    it('ToolDefinition should require handler field', () => {
      const content = readTypesTs();
      expect(content).toContain('handler');
    });

    it('ToolResult should have content array', () => {
      const content = readTypesTs();
      expect(content).toMatch(/content.*Array/);
    });

    it('ToolResult should support isError flag', () => {
      const content = readTypesTs();
      expect(content).toContain('isError');
    });

    it('ToolCall should have status field with valid values', () => {
      const content = readTypesTs();
      expect(content).toContain('pending');
      expect(content).toContain('running');
      expect(content).toContain('completed');
      expect(content).toContain('error');
    });
  });

  describe('Tool definitions from tools.ts', () => {
    it('should define AskUserQuestionTool', () => {
      const content = readToolsTs();
      expect(content).toContain('AskUserQuestionTool');
    });

    it('should define SkillTool with name skill', () => {
      const content = readToolsTs();
      expect(content).toContain("name: 'skill'");
    });

    it('should define TaskCreateTool with name task_create', () => {
      const content = readToolsTs();
      expect(content).toContain("name: 'task_create'");
    });

    it('should define WebFetchTool with name web_fetch', () => {
      const content = readToolsTs();
      expect(content).toContain("name: 'web_fetch'");
    });

    it('should define ALL_TOOLS array', () => {
      const content = readToolsTs();
      expect(content).toContain('ALL_TOOLS');
    });

    it('ALL_TOOLS should contain at least 10 tools', () => {
      const content = readToolsTs();
      const match = content.match(/ALL_TOOLS.*=\s*\[([\s\S]*?)\]/);
      if (match) {
        const items = match[1].split(',').filter(s => s.trim());
        expect(items.length).toBeGreaterThanOrEqual(10);
      }
    });
  });

  describe('Tool directory structure', () => {
    it('BashTool directory should exist', () => {
      expect(fs.existsSync(path.join(TOOLS_DIR, 'BashTool'))).toBe(true);
    });

    it('FileReadTool directory should exist', () => {
      expect(fs.existsSync(path.join(TOOLS_DIR, 'FileReadTool'))).toBe(true);
    });

    it('FileWriteTool directory should exist', () => {
      expect(fs.existsSync(path.join(TOOLS_DIR, 'FileWriteTool'))).toBe(true);
    });

    it('MCPTool directory should exist', () => {
      expect(fs.existsSync(path.join(TOOLS_DIR, 'MCPTool'))).toBe(true);
    });

    it('WebFetchTool directory should exist', () => {
      expect(fs.existsSync(path.join(TOOLS_DIR, 'WebFetchTool'))).toBe(true);
    });

    it('should export shared utilities', () => {
      const content = readIndexContent();
      expect(content).toContain('shared/');
    });

    it('should export testing tools', () => {
      const content = readIndexContent();
      expect(content).toContain('testing/');
    });
  });

  describe('Tool categories', () => {
    it('types.ts should define ToolCategory type', () => {
      const content = readTypesTs();
      expect(content).toContain('ToolCategory');
    });

    it('should export file operation tools', () => {
      const content = readIndexContent();
      expect(content).toContain('FileReadTool');
      expect(content).toContain('FileWriteTool');
      expect(content).toContain('FileEditTool');
    });

    it('should export search tools', () => {
      const content = readIndexContent();
      expect(content).toContain('GrepTool');
      expect(content).toContain('GlobTool');
    });

    it('should export task management tools', () => {
      const content = readIndexContent();
      expect(content).toContain('TaskCreateTool');
      expect(content).toContain('TaskGetTool');
      expect(content).toContain('TaskListTool');
    });

    it('should export team management tools', () => {
      const content = readIndexContent();
      expect(content).toContain('TeamCreateTool');
      expect(content).toContain('TeamDeleteTool');
    });
  });
});
