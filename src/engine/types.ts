export type EngineId = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface EntityRef {
  id: EngineId;
  kind?: string;
  tags?: readonly string[];
}

export interface EngineIssue {
  code: string;
  message: string;
  path?: string;
  details?: JsonObject;
}

export function assertEngineId(value: string, name = "Engine id"): void {
  if (!value.trim()) throw new RangeError(`${name} cannot be empty.`);
}

export function isJsonObject(value: JsonValue): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
