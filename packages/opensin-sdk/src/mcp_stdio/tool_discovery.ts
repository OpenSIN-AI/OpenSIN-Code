/**
 * MCP Tool Discovery — Discover and register tools from MCP servers
 * OpenSIN-Code Phase 2.3
 */

import { McpToolDefinition, McpResourceDefinition } from './types';
import { McpStdioClient } from './client';

export async function discoverTools(client: McpStdioClient): Promise<McpToolDefinition[]> {
  const result = await client.request('tools/list') as { tools: McpToolDefinition[] };
  return result.tools ?? [];
}

export async function discoverResources(client: McpStdioClient): Promise<McpResourceDefinition[]> {
  const result = await client.request('resources/list') as { resources: McpResourceDefinition[] };
  return result.resources ?? [];
}

export async function callTool(
  client: McpStdioClient,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request('tools/call', { name, arguments: args });
}

export async function readResource(
  client: McpStdioClient,
  uri: string
): Promise<unknown> {
  return client.request('resources/read', { uri });
}
