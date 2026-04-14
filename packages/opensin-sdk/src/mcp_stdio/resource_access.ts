/**
 * MCP Resource Access — Read and list MCP resources
 * OpenSIN-Code Phase 2.3
 */

import { McpResourceResult } from './types';
import { McpStdioClient } from './client';

export async function listResources(client: McpStdioClient): Promise<McpResourceResult> {
  const result = await client.request('resources/list') as McpResourceResult;
  return result;
}

export async function readResource(
  client: McpStdioClient,
  uri: string
): Promise<McpResourceResult> {
  const result = await client.request('resources/read', { uri }) as McpResourceResult;
  return result;
}

export async function listResourceTemplates(client: McpStdioClient): Promise<unknown> {
  const result = await client.request('resources/templates/list');
  return result;
}
