export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export class JsonError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'JsonError';
  }
}

export function parseJsonValue(json: string): JsonValue {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new JsonError(`Failed to parse JSON: ${(error as Error).message}`, error as Error);
  }
}

export function jsonValueToString(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

export function jsonValueAsObject(value: JsonValue): Record<string, JsonValue> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }
  return null;
}

export function jsonValueAsArray(value: JsonValue): JsonValue[] | null {
  if (Array.isArray(value)) {
    return value;
  }
  return null;
}

export function jsonValueAsString(value: JsonValue): string | null {
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

export function jsonValueAsNumber(value: JsonValue): number | null {
  if (typeof value === 'number') {
    return value;
  }
  return null;
}

export function jsonValueAsBoolean(value: JsonValue): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  return null;
}

export function getJsonValue(obj: JsonValue, key: string): JsonValue | undefined {
  const record = jsonValueAsObject(obj);
  if (record) {
    return record[key];
  }
  return undefined;
}