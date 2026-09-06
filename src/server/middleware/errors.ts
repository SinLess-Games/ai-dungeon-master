import type { Context, ErrorHandler, NotFoundHandler } from "hono";

export const appErrorCodes = [
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "VALIDATION_ERROR",
  "RATE_LIMITED",
  "INTERNAL_SERVER_ERROR",
  "SERVICE_UNAVAILABLE",
] as const;

export type AppErrorCode = (typeof appErrorCodes)[number];

export interface AppErrorDetails {
  [key: string]: unknown;
}

export interface ErrorResponseBody {
  error: {
    code: AppErrorCode;
    message: string;
    details?: AppErrorDetails;
    requestId?: string;
  };
}

export type AppErrorStatus =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 503;

export interface AppErrorOptions {
  code: AppErrorCode;
  message: string;
  status: AppErrorStatus;

  /**
   * `undefined` is explicitly included because this project enables
   * exactOptionalPropertyTypes.
   */
  details?: AppErrorDetails | undefined;

  expose?: boolean | undefined;
  cause?: unknown;
}

/**
 * Application-level error that can safely cross the HTTP boundary.
 *
 * Domain and service code can throw this without depending on Hono
 * response helpers.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: AppErrorStatus;

  /**
   * This property always exists on AppError instances, but may contain
   * undefined when no structured details were supplied.
   */
  readonly details: AppErrorDetails | undefined;

  readonly expose: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "AppError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.expose = options.expose ?? true;
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = "The request is invalid.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "BAD_REQUEST",
      message,
      status: 400,
      details,
    });

    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication is required.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "UNAUTHORIZED",
      message,
      status: 401,
      details,
    });

    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to perform this action.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "FORBIDDEN",
      message,
      status: 403,
      details,
    });

    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "The requested resource was not found.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "NOT_FOUND",
      message,
      status: 404,
      details,
    });

    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "The request conflicts with the current state of the resource.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "CONFLICT",
      message,
      status: 409,
      details,
    });

    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "The request failed validation.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "VALIDATION_ERROR",
      message,
      status: 422,
      details,
    });

    this.name = "ValidationError";
  }
}

export class RateLimitedError extends AppError {
  constructor(
    message = "Too many requests.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "RATE_LIMITED",
      message,
      status: 429,
      details,
    });

    this.name = "RateLimitedError";
  }
}

export class InternalServerError extends AppError {
  constructor(
    message = "An unexpected server error occurred.",
    details?: AppErrorDetails | undefined,
    cause?: unknown,
  ) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message,
      status: 500,
      details,
      expose: false,
      cause,
    });

    this.name = "InternalServerError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = "The service is temporarily unavailable.",
    details?: AppErrorDetails | undefined,
  ) {
    super({
      code: "SERVICE_UNAVAILABLE",
      message,
      status: 503,
      details,
    });

    this.name = "ServiceUnavailableError";
  }
}

/**
 * Returns the request ID when one has been attached to the request.
 *
 * A dedicated request-ID middleware can later generate this value for
 * requests that do not already provide one.
 */
function getRequestId(c: Context): string | undefined {
  return c.req.header("x-request-id");
}

/**
 * Handles routes that were not matched by Hono.
 *
 * API requests receive the standard JSON error shape.
 * Non-API requests remain plain text because SPA/static asset fallback
 * behavior belongs to the Cloudflare asset layer.
 */
export const notFoundHandler: NotFoundHandler = (c) => {
  if (!c.req.path.startsWith("/api")) {
    return c.text("Not Found", 404);
  }

  const requestId = getRequestId(c);

  const body: ErrorResponseBody = {
    error: {
      code: "NOT_FOUND",
      message: "The requested API endpoint does not exist.",
      ...(requestId ? { requestId } : {}),
    },
  };

  return c.json(body, 404);
};

/**
 * Central Hono error handler.
 *
 * Known AppError instances are translated into the standard API error
 * contract. Unknown errors are logged and converted to a safe 500 response.
 */
export const errorHandler: ErrorHandler = (error, c) => {
  const requestId = getRequestId(c);

  if (error instanceof AppError) {
    const body: ErrorResponseBody = {
      error: {
        code: error.code,

        message: error.expose
          ? error.message
          : "An unexpected server error occurred.",

        ...(error.expose && error.details !== undefined
          ? {
              details: error.details,
            }
          : {}),

        ...(requestId ? { requestId } : {}),
      },
    };

    return c.json(body, error.status);
  }

  console.error("Unhandled server error", {
    requestId,
    method: c.req.method,
    path: c.req.path,
    error,
  });

  const body: ErrorResponseBody = {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred.",
      ...(requestId ? { requestId } : {}),
    },
  };

  return c.json(body, 500);
};