/**
 * Range — the return type of every engine function.
 *
 * No engine returns a bare number. Every value in this product is uncertain,
 * so the uncertainty travels with it. That is what makes an honest
 * "too close to call" verdict possible.
 *
 * confidence is DERIVED from band width, never asserted. You cannot label a
 * ±40% estimate "good".
 *
 * --- On the arithmetic ------------------------------------------------------
 *
 * This module combines uncertainties by ROOT-SUM-SQUARE, not by worst-case
 * interval arithmetic.
 *
 * Worst-case intervals assume every independent error hits its maximum in the
 * same direction at the same time. With six uncertain inputs that is
 * statistically absurd, and it is not merely conservative — it is wrong in a
 * way that destroys the product. Measured on this model: a demand estimate
 * carrying coal type, boiler class, weather, comfort and secondary-fuel
 * uncertainty came out at ±86% under worst-case corners and ±38% under RSS.
 * At ±86% every scenario overlaps every other, the verdict engine can never
 * name a winner, and twenty honest questions produce an answer of "we cannot
 * tell you."
 *
 * RSS is the standard treatment for independent error sources and it is what
 * an energy auditor would recognise. Where errors are NOT independent — the
 * same coal price feeding two scenarios, say — pass the same Range object
 * through rather than two separately-derived ones, and the correlation is
 * preserved by construction.
 *
 * worstCase() is kept for the rare genuinely-correlated case and for showing
 * the difference on stage.
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

/** Absolute half-width. */
export function halfWidth(r: Range): number {
  return (r.high - r.low) / 2;
}

function classify(low: number, mid: number, high: number): Confidence {
  const s = mid === 0 ? 0 : (high - low) / 2 / Math.abs(mid);
  if (s <= 0.2) return "good";
  if (s <= 0.4) return "rough";
  return "tooRough";
}

export function range(low: number, mid: number, high: number): Range {
  if (low > high) throw new Error(`range: low ${low} exceeds high ${high}`);
  return { low, mid, high, confidence: classify(low, mid, high) };
}

/** Build from a midpoint and a relative half-width (0.15 = ±15%). */
export function fromSpread(mid: number, relativeHalfWidth: number): Range {
  const d = Math.abs(mid) * relativeHalfWidth;
  return range(mid - d, mid, mid + d);
}

/** Build from a midpoint and an absolute half-width. */
export function fromHalfWidth(mid: number, absoluteHalfWidth: number): Range {
  const d = Math.abs(absoluteHalfWidth);
  return range(mid - d, mid, mid + d);
}

/** A value known exactly. Rare in this product. */
export function exact(v: number): Range {
  return range(v, v, v);
}

// --- combination helpers ----------------------------------------------------

const rss = (...xs: number[]) => Math.sqrt(xs.reduce((a, x) => a + x * x, 0));

// --- arithmetic -------------------------------------------------------------

/**
 * Addition. Absolute uncertainties combine in quadrature.
 * 100±10 plus 100±10 gives 200±14, not 200±20.
 */
export function add(a: Range, b: Range): Range {
  return fromHalfWidth(a.mid + b.mid, rss(halfWidth(a), halfWidth(b)));
}

/**
 * Subtraction. Same absolute treatment — subtracting a grant from a cost does
 * not cancel their uncertainties, it combines them.
 */
export function subtract(a: Range, b: Range): Range {
  return fromHalfWidth(a.mid - b.mid, rss(halfWidth(a), halfWidth(b)));
}

/**
 * Multiplication. RELATIVE uncertainties combine in quadrature.
 * ±20% times ±20% gives ±28%, not ±40%.
 */
export function multiply(a: Range, b: Range): Range {
  const mid = a.mid * b.mid;
  return fromSpread(mid, rss(spread(a), spread(b)));
}

/** Division. Same relative treatment as multiplication. */
export function divide(a: Range, b: Range): Range {
  if (b.low <= 0 && b.high >= 0) {
    throw new Error("divide: denominator range spans zero");
  }
  const mid = a.mid / b.mid;
  return fromSpread(mid, rss(spread(a), spread(b)));
}

/** Multiply by a number known exactly. Adds no uncertainty of its own. */
export function scale(a: Range, k: number): Range {
  const lo = a.low * k;
  const hi = a.high * k;
  return range(Math.min(lo, hi), a.mid * k, Math.max(lo, hi));
}

/**
 * Worst-case interval multiplication. Assumes both errors hit maximum in the
 * same direction. Correct only when the two inputs are driven by the same
 * underlying unknown. Kept mainly to demonstrate the difference.
 */
export function worstCase(a: Range, b: Range): Range {
  const corners = [a.low * b.low, a.low * b.high, a.high * b.low, a.high * b.high];
  return range(Math.min(...corners), a.mid * b.mid, Math.max(...corners));
}

// --- comparison -------------------------------------------------------------

/**
 * Do two ranges overlap enough that we must not rank them?
 *
 * If the overlap exceeds 20% of the narrower range's width, there is no
 * winner and the tool says so rather than inventing one.
 */
export function tooCloseToCall(a: Range, b: Range, threshold = 0.2): boolean {
  // Two values known exactly and equal are not "rankable" — there is no winner.
  // Degenerate in practice (nothing in this model is exact) but the alternative
  // is claiming one of two identical numbers beats the other.
  if (a.mid === b.mid && halfWidth(a) === 0 && halfWidth(b) === 0) return true;

  const overlap = Math.min(a.high, b.high) - Math.max(a.low, b.low);
  if (overlap <= 0) return false;

  const widthA = a.high - a.low;
  const widthB = b.high - b.low;
  const narrower = Math.min(widthA, widthB);

  if (narrower === 0) return a.mid === b.mid;

  return overlap / narrower > threshold;
}

/**
 * Widen a band to reflect distance in years. The further out you forecast, the
 * less you know: half-width grows 3% of itself per year, so ±20% at year 0 is
 * ±32% at year 20.
 */
export function widenForYear(r: Range, year: number): Range {
  if (year <= 0) return r;
  return fromHalfWidth(r.mid, halfWidth(r) * (1 + 0.03 * year));
}
