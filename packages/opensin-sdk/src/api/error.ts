export class ApiError extends Error {
  public readonly status?: number;
  public readonly errorType?: string;
  public readonly messageBody?: string;
  public readonly body: string;
  public readonly retryable: boolean;
  public readonly attempts?: number;
  public readonly lastError?: ApiError;

  constructor(
    message: string,
    options?: {
      status?: number;
      errorType?: string;
      messageBody?: string;
      body?: string;
      retryable?: boolean;
      attempts?: number;
      lastError?: ApiError;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.errorType = options?.errorType;
    this.messageBody = options?.messageBody;
    this.body = options?.body ?? "";
    this.retryable = options?.retryable ?? false;
    this.attempts = options?.attempts;
    this.lastError = options?.lastError;
  }

  static missingCredentials(
    provider: string,
    envVars: string[]
  ): ApiError {
    return new ApiError(
      `missing ${provider} credentials; export ${envVars.join(" or ")} before calling the ${provider} API`,
      { retryable: false }
    );
  }

  static expiredOAuthToken(): ApiError {
    return new ApiError(
      "saved OAuth token is expired and no refresh token is available",
      { retryable: false }
    );
  }

  static auth(message: string): ApiError {
    return new ApiError(`auth error: ${message}`, { retryable: false });
  }

  static invalidApiKeyEnv(error: string): ApiError {
    return new ApiError(`failed to read credential environment variable: ${error}`, {
      retryable: false,
    });
  }

  static http(error: string): ApiError {
    const retryable =
      error.includes("connect") ||
      error.includes("timeout") ||
      error.includes("request");
    return new ApiError(`http error: ${error}`, { retryable });
  }

  static io(error: string): ApiError {
    return new ApiError(`io error: ${error}`, { retryable: false });
  }

  static json(error: string): ApiError {
    return new ApiError(`json error: ${error}`, { retryable: false });
  }

  static api(options: {
    status: number;
    errorType?: string;
    message?: string;
    body: string;
    retryable: boolean;
  }): ApiError {
    const msg =
      options.errorType && options.message
        ? `api returned ${options.status} (${options.errorType}): ${options.message}`
        : `api returned ${options.status}: ${options.body}`;
    return new ApiError(msg, {
      status: options.status,
      errorType: options.errorType,
      messageBody: options.message,
      body: options.body,
      retryable: options.retryable,
    });
  }

  static retriesExhausted(options: {
    attempts: number;
    lastError: ApiError;
  }): ApiError {
    return new ApiError(
      `api failed after ${options.attempts} attempts: ${options.lastError}`,
      {
        attempts: options.attempts,
        lastError: options.lastError,
        retryable: false,
      }
    );
  }

  static invalidSseFrame(message: string): ApiError {
    return new ApiError(`invalid sse frame: ${message}`, { retryable: false });
  }

  static backoffOverflow(options: { attempt: number; baseDelayMs: number }): ApiError {
    return new ApiError(
      `retry backoff overflowed on attempt ${options.attempt} with base delay ${options.baseDelayMs}ms`,
      { retryable: false }
    );
  }

  isRetryable(): boolean {
    if (this.retryable) return true;
    if (this.lastError?.isRetryable()) return true;
    return false;
  }
}

export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, { retryable: true });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }

  static create(options: { status: number; retryAfter?: number; body: string }): RateLimitError {
    const msg = options.retryAfter
      ? `rate limited, retry after ${options.retryAfter}s`
      : `rate limited: ${options.body}`;
    return new RateLimitError(msg, options.retryAfter);
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super(message, { retryable: false });
    this.name = "AuthError";
  }

  static create(message: string): AuthError {
    return new AuthError(message);
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, isRetryable: boolean) {
    super(message, { retryable: isRetryable });
    this.name = "NetworkError";
  }

  static create(message: string, retryable: boolean = true): NetworkError {
    return new NetworkError(message, retryable);
  }
}
