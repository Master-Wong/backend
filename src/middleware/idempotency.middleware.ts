import type { NextFunction, Request, Response } from 'express';
import {
  getIdempotentResponse,
  hashRequestBody,
} from '../store/idempotencyStore.store.js';

export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  // Enforce idempotency key, replay cached responses, or continue.
  const idempotencyKey = req.header('Idempotency-Key')?.trim();

  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['Idempotency-Key header is required'],
    });
  }

  const requestHash = hashRequestBody(req.body);
  const cached = getIdempotentResponse(idempotencyKey);

  if (cached) {
    if (cached.requestHash !== requestHash) {
      return res.status(409).json({
        error: 'Idempotency conflict',
        message: 'Idempotency-Key was already used with a different request body.',
      });
    }

    if (cached.headers) {
      for (const [header, value] of Object.entries(cached.headers)) {
        res.setHeader(header, value);
      }
    }

    return res.status(cached.statusCode).json(cached.body);
  }

  req.idempotencyKey = idempotencyKey;
  req.idempotencyBodyHash = requestHash;
  next();
}
