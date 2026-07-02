export function isFailureAmount(amount: number): boolean {
  // Treat amounts ending in 1 as simulated payment failures.
  const normalized = Math.floor(Math.abs(Number(amount)));
  return normalized % 10 === 1;
}

export function delay(ms: number): Promise<void> {
  // Pause async provider flows for realistic timing.
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
