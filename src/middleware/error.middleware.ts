import type { NextFunction, Request, Response } from 'express';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

function resolveStatus(err: HttpError): number {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return 400;
  }

  const status = err.status ?? err.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 600) {
    return status;
  }

  return 500;
}

export function notFoundHandler(_req: Request, res: Response): Response {
  // Return JSON for routes that do not exist.
  return res.status(404).json({
    error: 'Not found',
    message: 'The requested resource does not exist.',
  });
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  // Map thrown errors to consistent JSON responses.
  const status = resolveStatus(err);
  const isClientError = status >= 400 && status < 500;

  if (isClientError) {
    return res.status(status).json({
      error: err.message || 'Bad request',
      message: err.message || 'Bad request',
    });
  }

  return res.status(status).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again.',
  });
}
