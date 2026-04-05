import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileTool, resetProfileManager } from '../tools_v2/ProfileTool/ProfileTool.js';

describe('ProfileTool', () => {
  beforeEach(() => {
    resetProfileManager();
  });

  it('should be defined', () => {
    expect(ProfileTool).toBeDefined();
    expect(ProfileTool.name).toBe('profile');
  });

  it('should have correct schema', () => {
    expect(ProfileTool.inputSchema.type).toBe('object');
    expect(ProfileTool.inputSchema.required).toContain('action');
    expect(ProfileTool.inputSchema.properties.action.enum).toContain('list');
    expect(ProfileTool.inputSchema.properties.action.enum).toContain('switch');
    expect(ProfileTool.inputSchema.properties.action.enum).toContain('create');
    expect(ProfileTool.inputSchema.properties.action.enum).toContain('delete');
    expect(ProfileTool.inputSchema.properties.action.enum).toContain('show');
    expect(ProfileTool.inputSchema.properties.action.enum).toContain('current');
  });

  it('should list profiles', async () => {
    const result = await ProfileTool.execute({ action: 'list' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('code');
    expect(result.content[0].text).toContain('plan');
  });

  it('should show current profile', async () => {
    const result = await ProfileTool.execute({ action: 'current' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('code');
  });

  it('should switch profile', async () => {
    const result = await ProfileTool.execute({ action: 'switch', name: 'plan' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('plan');
  });

  it('should reject switching to non-existent profile', async () => {
    const result = await ProfileTool.execute({ action: 'switch', name: 'nonexistent' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });

  it('should show profile details', async () => {
    const result = await ProfileTool.execute({ action: 'show', name: 'debug' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('debug');
    expect(result.content[0].text).toContain('Prompt:');
  });

  it('should reject showing non-existent profile', async () => {
    const result = await ProfileTool.execute({ action: 'show', name: 'nonexistent' });
    expect(result.isError).toBe(true);
  });

  it('should reject unknown action', async () => {
    const result = await ProfileTool.execute({ action: 'unknown' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action');
  });

  it('should reject create without required params', async () => {
    const result = await ProfileTool.execute({ action: 'create' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Usage');
  });

  it('should reject delete without name', async () => {
    const result = await ProfileTool.execute({ action: 'delete' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Usage');
  });

  it('should reject deleting built-in profile', async () => {
    const result = await ProfileTool.execute({ action: 'delete', name: 'code' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Built-in');
  });
});
