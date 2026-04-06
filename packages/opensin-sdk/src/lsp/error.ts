/**
 * LSP Error Types — Sin-branded error handling for LSP operations.
 */

export enum LspErrorCode {
  IO = "IO_ERROR",
  JSON = "JSON_ERROR",
  INVALID_HEADER = "INVALID_HEADER",
  MISSING_CONTENT_LENGTH = "MISSING_CONTENT_LENGTH",
  INVALID_CONTENT_LENGTH = "INVALID_CONTENT_LENGTH",
  UNSUPPORTED_DOCUMENT = "UNSUPPORTED_DOCUMENT",
  UNKNOWN_SERVER = "UNKNOWN_SERVER",
  DUPLICATE_EXTENSION = "DUPLICATE_EXTENSION",
  PATH_TO_URL = "PATH_TO_URL",
  PROTOCOL = "PROTOCOL_ERROR",
}

export class LspError extends Error {
  public readonly code: LspErrorCode;
  public readonly details?: unknown;

  constructor(code: LspErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "LspError";
    this.code = code;
    this.details = details;
  }

  static io(message: string): LspError {
    return new LspError(LspErrorCode.IO, message);
  }

  static json(message: string): LspError {
    return new LspError(LspErrorCode.JSON, message);
  }

  static invalidHeader(header: string): LspError {
    return new LspError(LspErrorCode.INVALID_HEADER, `Invalid LSP header: ${header}`);
  }

  static missingContentLength(): LspError {
    return new LspError(LspErrorCode.MISSING_CONTENT_LENGTH, "Missing LSP Content-Length header");
  }

  static invalidContentLength(value: string): LspError {
    return new LspError(LspErrorCode.INVALID_CONTENT_LENGTH, `Invalid LSP Content-Length value: ${value}`);
  }

  static unsupportedDocument(path: string): LspError {
    return new LspError(LspErrorCode.UNSUPPORTED_DOCUMENT, `No LSP server configured for ${path}`);
  }

  static unknownServer(name: string): LspError {
    return new LspError(LspErrorCode.UNKNOWN_SERVER, `Unknown LSP server: ${name}`);
  }

  static duplicateExtension(extension: string, existing: string, newServer: string): LspError {
    return new LspError(
      LspErrorCode.DUPLICATE_EXTENSION,
      `Duplicate LSP extension mapping for ${extension}: ${existing} and ${newServer}`
    );
  }

  static pathToUrl(path: string): LspError {
    return new LspError(LspErrorCode.PATH_TO_URL, `Failed to convert path to file URL: ${path}`);
  }

  static protocol(message: string): LspError {
    return new LspError(LspErrorCode.PROTOCOL, `LSP protocol error: ${message}`);
  }
}

export function isLspError(error: unknown): error is LspError {
  return error instanceof LspError;
}