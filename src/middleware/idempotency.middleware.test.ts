import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { idempotencyMiddleware } from './idempotency.middleware.js';
import {
  hashRequestBody,
  saveIdempotentResponse,
} from '../store/idempotencyStore.store.js';

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  };

  return res as Response & {
    statusCode: number;
    headers: Record<string, string>;
    body: unknown;
  };
}

describe('idempotencyMiddleware', () => {
  it('returns 400 when Idempotency-Key is missing', () => {
    const req = { header: () => undefined, body: {} } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    idempotencyMiddleware(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('replays a cached response for the same key and body', () => {
    const body = { amount: 1000 };
    const key = `replay-key-${Date.now()}`;
    const hash = hashRequestBody(body);

    saveIdempotentResponse(key, hash, 201, { status: 'completed' });

    const req = {
      header: () => key,
      body,
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    idempotencyMiddleware(req, res, next);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ status: 'completed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 409 when the same key is reused with a different body', () => {
    const key = `conflict-key-${Date.now()}`;
    saveIdempotentResponse(key, hashRequestBody({ amount: 1000 }), 201, {});

    const req = {
      header: () => key,
      body: { amount: 2000 },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    idempotencyMiddleware(req, res, next);

    expect(res.statusCode).toBe(409);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when the key is new', () => {
    const req = {
      header: () => `new-key-${Date.now()}`,
      body: { amount: 1000 },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    idempotencyMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.idempotencyKey).toBeTruthy();
  });
});
