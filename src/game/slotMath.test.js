import { describe, expect, it } from 'vitest';
import { evaluateSpin, gridFromStops, PAYLINES, REEL_STRIPS } from './slotMath.js';

describe('Mega Mesa slot math', () => {
  it('defines twenty unique paylines', () => {
    expect(PAYLINES).toHaveLength(20);
    expect(new Set(PAYLINES.map((line) => line.rows.join(','))).size).toBe(20);
  });

  it('maps physical reel stops to the visible three-row window', () => {
    const grid = gridFromStops([0, 0, 0, 0, 0]);
    expect(grid[0]).toEqual({
      top: REEL_STRIPS[0][1],
      center: REEL_STRIPS[0][0],
      bottom: REEL_STRIPS[0].at(-1),
    });
  });

  it('lets wild substitute on a left-to-right line', () => {
    // Center row: king, WILD, king, king, king.
    const result = evaluateSpin([0, 11, 3, 0, 2], 100, 40_000);
    expect(result.wins).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'line', lineIndex: 0, symbol: 'king', count: 5 }),
    ]));
  });

  it('awards free spins for three or more visible dynamite scatters', () => {
    const result = evaluateSpin([4, 9, 7, 10, 4], 100, 40_000);
    expect(result.scatterCount).toBeGreaterThanOrEqual(3);
    expect(result.freeSpinsAwarded).toBeGreaterThanOrEqual(5);
    expect(result.payout).toBeGreaterThan(0);
  });

  it('pays an all-wild line and the five-MEGA progressive condition', () => {
    const wilds = evaluateSpin([10, 11, 4, 9, 10], 100, 40_000);
    expect(wilds.wins).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'line', lineIndex: 0, symbol: 'wild', count: 5 }),
    ]));

    const mega = evaluateSpin([11, 4, 11, 4, 11], 100, 40_000);
    expect(mega.megaJackpot).toBe(true);
    expect(mega.wins).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'jackpot', amount: 40_000 }),
    ]));
  });

  it('rejects malformed stops and bets', () => {
    expect(() => gridFromStops([0])).toThrow(TypeError);
    expect(() => gridFromStops([99, 0, 0, 0, 0])).toThrow(RangeError);
    expect(() => evaluateSpin([0, 0, 0, 0, 0], 0)).toThrow(RangeError);
  });
});
