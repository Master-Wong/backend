import { createHash } from 'node:crypto';
import { appConfig } from '../config/app.config.js';
import type { IdempotentCachedResponse } from '../types/donation.types.js';

const idempotencyRecords = new Map<string, IdempotentCachedResponse>();

function hashRequestBody(body: unknown): string {
  // Hash request payload for idempotency conflict detection.
  return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
}

function purgeExpired(): void {
  // Remove idempotency records past their TTL.
  const now = Date.now();
  for (const [key, record] of idempotencyRecords.entries()) {
    if (record.expiresAt <= now) {
      idempotencyRecords.delete(key);
    }
  }
}

function getIdempotentResponse(key: string): IdempotentCachedResponse | null {
  // Fetch a cached response for a prior idempotent request.
  purgeExpired();
  return idempotencyRecords.get(key) ?? null;
}

function saveIdempotentResponse(
  key: string,
  requestHash: string,
  statusCode: number,
  body: unknown,
  headers?: Record<string, string>,
): void {
  // Cache a successful response for future replays.
  purgeExpired();
  idempotencyRecords.set(key, {
    statusCode,
    body,
    headers,
    requestHash,
    expiresAt: Date.now() + appConfig.idempotencyTtlMs,
  });
}

export {
  hashRequestBody,
  getIdempotentResponse,
  saveIdempotentResponse,
};
