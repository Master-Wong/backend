import { describe, expect, it } from 'vitest';
import { isFailureAmount } from './shared.js';

describe('isFailureAmount', () => {
  it('returns true when the amount ends in 1', () => {
    expect(isFailureAmount(1001)).toBe(true);
    expect(isFailureAmount(11)).toBe(true);
    expect(isFailureAmount(1)).toBe(true);
  });

  it('returns false for other amounts', () => {
    expect(isFailureAmount(1000)).toBe(false);
    expect(isFailureAmount(500)).toBe(false);
    expect(isFailureAmount(1002)).toBe(false);
  });

  it('uses the integer part of decimal amounts', () => {
    expect(isFailureAmount(1000.9)).toBe(false);
    expect(isFailureAmount(1001.5)).toBe(true);
  });
});
