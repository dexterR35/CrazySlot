export const SYMBOLS = {
  mega: { label: 'MEGA', name: 'Mega Gold', color: '#ffd35a', glow: '#fff0a4' },
  wild: { label: 'WILD', name: 'Wanted Wild', color: '#f4d29b', glow: '#ffb84e' },
  dynamite: { label: 'TNT', name: 'Dynamite Scatter', color: '#ff493f', glow: '#ff8a52' },
  sheriff: { label: '★', name: 'Sheriff Star', color: '#ffe173', glow: '#fff2a9' },
  skull: { label: '☠', name: 'Desert Skull', color: '#dff5e7', glow: '#a8f0d4' },
  whiskey: { label: 'XXX', name: 'Gold Whiskey', color: '#ffad48', glow: '#ffd58d' },
  boot: { label: 'BOOT', name: 'Cowboy Boots', color: '#4edcf1', glow: '#a8f4ff' },
  ace: { label: 'A', name: 'Frontier Ace', color: '#ef4f61', glow: '#ff9da8' },
  king: { label: 'K', name: 'Frontier King', color: '#6598ff', glow: '#a8c6ff' },
};

export const PAYTABLE = {
  mega: { 3: 80, 4: 250, 5: 1000 },
  wild: { 3: 50, 4: 160, 5: 600 },
  sheriff: { 3: 25, 4: 75, 5: 250 },
  skull: { 3: 18, 4: 50, 5: 160 },
  whiskey: { 3: 14, 4: 40, 5: 120 },
  boot: { 3: 10, 4: 25, 5: 80 },
  ace: { 3: 8, 4: 18, 5: 50 },
  king: { 3: 6, 4: 14, 5: 40 },
};

export const REEL_STRIPS = [
  ['king', 'boot', 'ace', 'skull', 'dynamite', 'king', 'whiskey', 'ace', 'sheriff', 'boot', 'wild', 'mega'],
  ['ace', 'king', 'boot', 'whiskey', 'mega', 'ace', 'skull', 'king', 'sheriff', 'dynamite', 'boot', 'wild'],
  ['boot', 'skull', 'ace', 'king', 'wild', 'whiskey', 'boot', 'dynamite', 'sheriff', 'ace', 'king', 'mega'],
  ['king', 'ace', 'whiskey', 'boot', 'mega', 'skull', 'ace', 'sheriff', 'king', 'wild', 'dynamite', 'boot'],
  ['ace', 'boot', 'king', 'skull', 'dynamite', 'whiskey', 'ace', 'boot', 'sheriff', 'king', 'wild', 'mega'],
];

// Rows use -1 = top, 0 = center, 1 = bottom.
export const PAYLINES = [
  { name: 'Straight Center', rows: [0, 0, 0, 0, 0] },
  { name: 'Straight Top', rows: [-1, -1, -1, -1, -1] },
  { name: 'Straight Bottom', rows: [1, 1, 1, 1, 1] },
  { name: 'High V', rows: [-1, 0, 1, 0, -1] },
  { name: 'Low V', rows: [1, 0, -1, 0, 1] },
  { name: 'Upper Step', rows: [-1, -1, 0, 1, 1] },
  { name: 'Lower Step', rows: [1, 1, 0, -1, -1] },
  { name: 'Top Chevron', rows: [0, -1, -1, -1, 0] },
  { name: 'Bottom Chevron', rows: [0, 1, 1, 1, 0] },
  { name: 'Small Peak', rows: [0, 0, -1, 0, 0] },
  { name: 'Small Valley', rows: [0, 0, 1, 0, 0] },
  { name: 'Rising Trail', rows: [1, 1, 0, 0, -1] },
  { name: 'Falling Trail', rows: [-1, -1, 0, 0, 1] },
  { name: 'Mesa Peak', rows: [1, 0, 0, 0, 1] },
  { name: 'Mesa Valley', rows: [-1, 0, 0, 0, -1] },
  { name: 'Zig Zag High', rows: [-1, 0, -1, 0, -1] },
  { name: 'Zig Zag Low', rows: [1, 0, 1, 0, 1] },
  { name: 'High Spurs', rows: [-1, 0, 1, 1, 1] },
  { name: 'Low Spurs', rows: [1, 0, -1, -1, -1] },
  { name: 'Dust Trail', rows: [0, -1, 0, 1, 0] },
];

function secureRandomInt(maxExclusive) {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('maxExclusive must be a positive safe integer');
  }
  const range = 0x1_0000_0000;
  const limit = range - (range % maxExclusive);
  const values = new Uint32Array(1);
  do globalThis.crypto.getRandomValues(values);
  while (values[0] >= limit);
  return values[0] % maxExclusive;
}

export function createStops() {
  return REEL_STRIPS.map((strip) => secureRandomInt(strip.length));
}

export function gridFromStops(stops) {
  if (!Array.isArray(stops) || stops.length !== REEL_STRIPS.length) {
    throw new TypeError('A stop is required for every reel');
  }
  return REEL_STRIPS.map((strip, reelIndex) => {
    const center = stops[reelIndex];
    if (!Number.isInteger(center) || center < 0 || center >= strip.length) {
      throw new RangeError(`Invalid stop for reel ${reelIndex}`);
    }
    return {
      top: strip[(center + 1) % strip.length],
      center: strip[center],
      bottom: strip[(center - 1 + strip.length) % strip.length],
    };
  });
}

function evaluateLine(symbols) {
  const payingSymbol = symbols.find((symbol) => symbol !== 'wild');
  if (!payingSymbol) return { symbol: 'wild', count: symbols.length };
  if (payingSymbol === 'dynamite') return null;
  let count = 0;
  for (const symbol of symbols) {
    if (symbol === payingSymbol || symbol === 'wild') count += 1;
    else break;
  }
  return count >= 3 ? { symbol: payingSymbol, count } : null;
}

export function evaluateSpin(stops, totalBet, progressiveValue = 0) {
  if (!Number.isFinite(totalBet) || totalBet <= 0) throw new RangeError('Bet must be positive');
  const grid = gridFromStops(stops);
  const lineBet = totalBet / PAYLINES.length;
  const rowKey = { '-1': 'top', 0: 'center', 1: 'bottom' };
  const wins = [];

  PAYLINES.forEach((line, lineIndex) => {
    const symbols = line.rows.map((row, reel) => grid[reel][rowKey[row]]);
    const match = evaluateLine(symbols);
    if (!match) return;
    const multiplier = PAYTABLE[match.symbol][match.count];
    wins.push({
      type: 'line',
      lineIndex,
      lineName: line.name,
      symbol: match.symbol,
      count: match.count,
      multiplier,
      amount: Math.round(lineBet * multiplier),
    });
  });

  const scatterCount = grid.reduce((count, reel) => count + Object.values(reel).filter((symbol) => symbol === 'dynamite').length, 0);
  const freeSpinsAwarded = scatterCount >= 3 ? ({ 3: 5, 4: 8, 5: 12 }[Math.min(scatterCount, 5)]) : 0;
  const scatterPayout = scatterCount >= 3 ? totalBet * ({ 3: 2, 4: 10, 5: 50 }[Math.min(scatterCount, 5)]) : 0;
  if (scatterPayout) {
    wins.push({ type: 'scatter', lineIndex: null, lineName: 'Dynamite Bonus', symbol: 'dynamite', count: scatterCount, multiplier: scatterPayout / totalBet, amount: scatterPayout });
  }

  const megaJackpot = grid.every((reel) => reel.center === 'mega');
  if (megaJackpot) {
    wins.push({ type: 'jackpot', lineIndex: 0, lineName: 'MEGA JACKPOT', symbol: 'mega', count: 5, multiplier: 0, amount: Math.round(progressiveValue) });
  }

  return {
    grid,
    wins,
    scatterCount,
    freeSpinsAwarded,
    megaJackpot,
    payout: wins.reduce((total, win) => total + win.amount, 0),
  };
}

export function formatCredits(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}
