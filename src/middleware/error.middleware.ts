import type { NextFunction, Request, Response } from 'express';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

function resolveStatus(err: HttpError): number {
  // invalid json body, syntax error, or other parsing issue
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
  // Wrong path or typo  
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
  // Handle errors and send appropriate responses based on the error type and status code.
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
