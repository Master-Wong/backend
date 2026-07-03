import type { NextFunction, Request, Response } from 'express';
import {
  getIdempotentResponse,
  hashRequestBody,
} from '../store/idempotencyStore.store.js';
import { randomUUID } from 'node:crypto';

export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  // a client-supplied key; otherwise generate one so a plain POST still works.
  const idempotencyKey = req.header('Idempotency-Key')?.trim() || randomUUID();



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
  res.setHeader('Idempotency-Key', idempotencyKey);
  next();
}
