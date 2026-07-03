import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { errorHandler, notFoundHandler } from './error.middleware.js';

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as Response & { statusCode: number; body: unknown };
}

describe('error middleware', () => {
  it('returns 404 JSON for unknown routes', () => {
    const res = createMockResponse();

    notFoundHandler({} as Request, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: 'Not found',
      message: 'The requested resource does not exist.',
    });
  });

  it('returns 500 JSON for unexpected errors', () => {
    const res = createMockResponse();
    const next = (() => {}) as NextFunction;

    errorHandler(new Error('Database unavailable'), {} as Request, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.',
    });
  });

  it('returns client error status when provided on the error', () => {
    const res = createMockResponse();
    const next = (() => {}) as NextFunction;
    const err = new Error('Payment failed') as Error & { status: number };
    err.status = 402;

    errorHandler(err, {} as Request, res, next);

    expect(res.statusCode).toBe(402);
    expect(res.body).toEqual({
      error: 'Payment failed',
      message: 'Payment failed',
    });
  });

  it('returns 400 JSON for malformed JSON bodies', () => {
    const res = createMockResponse();
    const next = (() => {}) as NextFunction;
    const err = new SyntaxError('Unexpected token') as SyntaxError & { type: string };
    err.type = 'entity.parse.failed';

    errorHandler(err, {} as Request, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Unexpected token',
      message: 'Unexpected token',
    });
  });
});
