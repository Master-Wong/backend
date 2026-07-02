function readInt(value: string | undefined, fallback: number): number {
  // Parse integer env vars with a safe fallback default.
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const appConfig = {
  mpesaCallbackDelayMs: readInt(process.env.MPESA_CALLBACK_DELAY_MS, 3000),
  mpesaFailureDelayMs: readInt(process.env.MPESA_FAILURE_DELAY_MS, 5000),
  cardSuccessDelayMs: readInt(process.env.CARD_SUCCESS_DELAY_MS, 800),
  cardFailureDelayMs: readInt(process.env.CARD_FAILURE_DELAY_MS, 5000),
  rateLimitWindowMs: readInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: readInt(process.env.RATE_LIMIT_MAX, 20),
  idempotencyTtlMs: readInt(process.env.IDEMPOTENCY_TTL_MS, 86_400_000),
  pollIntervalMs: readInt(process.env.POLL_INTERVAL_MS, 2000),
  pollMaxAttempts: readInt(process.env.POLL_MAX_ATTEMPTS, 60),
} as const;
