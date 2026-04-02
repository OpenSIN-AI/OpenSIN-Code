#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "simone",
  version: "0.1.0",
});

server.tool(
  "find_symbol",
  "Find a symbol (function, class, variable) in the codebase by name",
  {
    name: z.string().describe("Symbol name to search for"),
    file_path: z.string().optional().describe("Optional file path to limit search scope"),
  },
  async ({ name, file_path }) => {
    const { $ } = await import("bun");
    const query = file_path
      ? `Find symbol: ${name} in ${file_path}`
      : `Find symbol: ${name}`;
    try {
      const proc = $`sincode run ${query} --format json`.quiet();
      const out = await proc.text();
      return {
        content: [{ type: "text", text: out }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "find_references",
  "Find all references to a symbol in a specific file",
  {
    name: z.string().describe("Symbol name"),
    file_path: z.string().describe("File path to search in"),
  },
  async ({ name, file_path }) => {
    const { $ } = await import("bun");
    const query = `Find references to: ${name} in ${file_path}`;
    try {
      const proc = $`sincode run ${query} --format json`.quiet();
      const out = await proc.text();
      return {
        content: [{ type: "text", text: out }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "replace_symbol",
  "Replace the body/implementation of a symbol in a file",
  {
    name: z.string().describe("Symbol name to replace"),
    file_path: z.string().describe("File path containing the symbol"),
    new_body: z.string().describe("New implementation/body for the symbol"),
  },
  async ({ name, file_path, new_body }) => {
    const { $ } = await import("bun");
    const query = `Replace symbol ${name} in ${file_path} with: ${new_body}`;
    try {
      const proc = $`sincode run ${query}`.quiet();
      const out = await proc.text();
      return {
        content: [{ type: "text", text: out }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
