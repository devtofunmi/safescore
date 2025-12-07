/**
 * Utility functions for odds parsing and validation
 */

export function parseOddsRange(range: string | undefined): [number, number] {
  const defaultRange: [number, number] = [1.1, 1.4];
  
  if (!range || typeof range !== 'string') {
    return defaultRange;
  }

  const m = range.match(/([0-9]*\.?[0-9]+)\s*-\s*([0-9]*\.?[0-9]+)/);
  if (!m) {
    return defaultRange;
  }

  const a = parseFloat(m[1]);
  const b = parseFloat(m[2]);

  // Validate parsed numbers
  if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b >= a) {
    return [a, b];
  }

  return defaultRange;
}

export function calculateOdds(minOdds: number, maxOdds: number): number {
  const midpoint = (minOdds + maxOdds) / 2;
  return parseFloat(midpoint.toFixed(2));
}
