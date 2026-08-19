/**
 * Range — the return type of every engine function.
 *
 * No engine ever returns a bare number. If a value is uncertain (and every value
 * in this product is), the uncertainty travels with it. This is what makes the
 * "too close to call" verdict possible.
 *
 * confidence is derived, not asserted: it comes from how wide the band is
 * relative to the midpoint. You cannot label a ±40% estimate "good".
 */

export type Confidence = "good" | "rough" | "tooRough";

export interface Range {
  low: number;
  mid: number;
  high: number;
  confidence: Confidence;
}

/** Relative half-width of the band, e.g. 0.15 for ±15%. */
export function spread(r: Range): number {
  if (r.mid === 0) return 0;
  return (r.high - r.low) / 2 / Math.abs(r.mid);
}

function classify(low: number, mid: number, high: number): Confidence {
  const s = mid === 0 ? 0 : (high - low) / 2 / Math.abs(mid);
  if (s <= 0.2) return "good";
  if (s <= 0.4) return "rough";
  return "tooRough";
}

/** Build a Range from explicit bounds. Confidence is computed, never passed in. */
export function range(low: number, mid: number, high: number): Range {
  if (low > high) throw new Error(`range: low ${low} exceeds high ${high}`);
  return { low, mid, high, confidence: classify(low, mid, high) };
}

/** Build a Range from a midpoint and a relative half-width (0.15 = ±15%). */
export function fromSpread(mid: number, relativeHalfWidth: number): Range {
  const d = Math.abs(mid) * relativeHalfWidth;
  return range(mid - d, mid, mid + d);
}

/** A value known exactly. Rare in this product. */
export function exact(v: number): Range {
  return range(v, v, v);
}

// --- arithmetic -------------------------------------------------------------
// Interval arithmetic, deliberately naive. It treats inputs as independent and
// takes the worst case at each end, so bands widen faster than a statistical
// propagation would. That errs toward saying "we cannot tell you" — the right
// direction to err for this product.

export function add(a: Range, b: Range): Range {
  return range(a.low + b.low, a.mid + b.mid, a.high + b.high);
}

export function subtract(a: Range, b: Range): Range {
  return range(a.low - b.high, a.mid - b.mid, a.high - b.low);
}

export function multiply(a: Range, b: Range): Range {
  const corners = [
    a.low * b.low,
    a.low * b.high,
    a.high * b.low,
    a.high * b.high,
  ];
  return range(Math.min(...corners), a.mid * b.mid, Math.max(...corners));
}

export function divide(a: Range, b: Range): Range {
  if (b.low <= 0 && b.high >= 0) {
    throw new Error("divide: denominator range spans zero");
  }
  const corners = [a.low / b.low, a.low / b.high, a.high / b.low, a.high / b.high];
  return range(Math.min(...corners), a.mid / b.mid, Math.max(...corners));
}

export function scale(a: Range, k: number): Range {
  const lo = a.low * k;
  const hi = a.high * k;
  return range(Math.min(lo, hi), a.mid * k, Math.max(lo, hi));
}

// --- comparison -------------------------------------------------------------

/**
 * Do two ranges overlap enough that we must not rank them?
 *
 * The rule from the PRD: if the overlap exceeds 20% of the narrower range's
 * width, there is no winner. Two scenarios inside each other's error band get
 * an honest "too close to call" rather than a spurious ranking.
 */
export function tooCloseToCall(a: Range, b: Range, threshold = 0.2): boolean {
  const overlap = Math.min(a.high, b.high) - Math.max(a.low, b.low);
  if (overlap <= 0) return false;

  const widthA = a.high - a.low;
  const widthB = b.high - b.low;
  const narrower = Math.min(widthA, widthB);

  // Two near-exact values that happen to coincide are not "too close to call",
  // they are equal. Guard against a degenerate divide.
  if (narrower === 0) return a.mid === b.mid;

  return overlap / narrower > threshold;
}

/**
 * Widen a band to reflect distance in years.
 *
 * The further out you forecast, the less you know. PRD rule: half-width grows
 * by 3% of itself per year, so a ±20% band at year 0 is ±32% at year 20.
 */
export function widenForYear(r: Range, year: number): Range {
  if (year <= 0) return r;
  const factor = 1 + 0.03 * year;
  const halfWidth = ((r.high - r.low) / 2) * factor;
  return range(r.mid - halfWidth, r.mid, r.mid + halfWidth);
}
