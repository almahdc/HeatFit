import { describe, expect, it } from "vitest";
import {
  add,
  divide,
  exact,
  fromHalfWidth,
  fromSpread,
  halfWidth,
  multiply,
  range,
  scale,
  spread,
  subtract,
  tooCloseToCall,
  widenForYear,
  worstCase,
} from "../engines/range";

describe("construction and confidence", () => {
  it("derives confidence from band width, never accepts it as a claim", () => {
    expect(fromSpread(100, 0.1).confidence).toBe("good");
    expect(fromSpread(100, 0.3).confidence).toBe("rough");
    expect(fromSpread(100, 0.5).confidence).toBe("tooRough");
  });

  it("treats an exact value as exact", () => {
    const e = exact(42);
    expect(spread(e)).toBe(0);
    expect(e.confidence).toBe("good");
  });

  it("refuses an inverted range rather than silently swapping", () => {
    expect(() => range(10, 5, 1)).toThrow();
  });
});

describe("root-sum-square combination", () => {
  it("combines relative errors in quadrature on multiply", () => {
    // ±20% x ±20% -> ±28%, not ±40%
    const r = multiply(fromSpread(10, 0.2), fromSpread(10, 0.2));
    expect(spread(r)).toBeCloseTo(Math.SQRT2 * 0.2, 4);
    expect(r.mid).toBeCloseTo(100, 6);
  });

  it("combines absolute errors in quadrature on add", () => {
    // 100±10 + 100±10 -> 200±14.1, not 200±20
    const r = add(fromHalfWidth(100, 10), fromHalfWidth(100, 10));
    expect(r.mid).toBeCloseTo(200, 6);
    expect(halfWidth(r)).toBeCloseTo(Math.sqrt(200), 4);
  });

  it("does not let subtraction cancel uncertainty", () => {
    // a grant with its own error does not make the result more certain
    const r = subtract(fromHalfWidth(50000, 5000), fromHalfWidth(30000, 3000));
    expect(r.mid).toBeCloseTo(20000, 6);
    expect(halfWidth(r)).toBeGreaterThan(5000);
  });

  it("adds no uncertainty when scaling by an exact number", () => {
    const before = fromSpread(1000, 0.15);
    expect(spread(scale(before, 12))).toBeCloseTo(0.15, 6);
  });

  it("is materially narrower than worst-case cornering", () => {
    // This is the whole reason the module changed. Six uncertain factors under
    // worst-case corners produced a band too wide for any verdict to be given.
    let rssResult = fromSpread(16000, 0.19);
    let worst = fromSpread(16000, 0.19);
    for (const s of [0.14, 0.25, 0.12, 0.086, 0.077]) {
      rssResult = multiply(rssResult, fromSpread(1, s));
      worst = worstCase(worst, fromSpread(1, s));
    }
    expect(spread(worst)).toBeGreaterThan(0.8); // unusable
    expect(spread(rssResult)).toBeLessThan(0.4); // still says something
  });
});

describe("guards", () => {
  it("throws rather than guessing when a denominator spans zero", () => {
    expect(() => divide(exact(10), range(-1, 0, 1))).toThrow();
  });

  it("divides cleanly when the denominator is safely positive", () => {
    const r = divide(fromSpread(16000, 0.2), fromSpread(3, 0.15));
    expect(r.mid).toBeCloseTo(16000 / 3, 6);
    expect(spread(r)).toBeCloseTo(Math.hypot(0.2, 0.15), 4);
  });
});

describe("comparison", () => {
  it("refuses to rank two scenarios whose bands substantially overlap", () => {
    expect(tooCloseToCall(range(900, 1000, 1100), range(950, 1050, 1150))).toBe(
      true,
    );
  });

  it("does rank scenarios that are clearly apart", () => {
    expect(
      tooCloseToCall(range(900, 1000, 1100), range(1600, 1700, 1800)),
    ).toBe(false);
  });

  it("treats two identical exact values as equal, not as unrankable noise", () => {
    expect(tooCloseToCall(exact(500), exact(500))).toBe(true);
    expect(tooCloseToCall(exact(500), exact(900))).toBe(false);
  });
});

describe("forecast widening", () => {
  it("widens bands with distance in years without moving the midpoint", () => {
    const now = fromSpread(1000, 0.2);
    const later = widenForYear(now, 20);
    expect(spread(later)).toBeCloseTo(0.32, 2);
    expect(later.mid).toBe(now.mid);
  });

  it("leaves year zero alone", () => {
    const now = fromSpread(1000, 0.2);
    expect(widenForYear(now, 0)).toEqual(now);
  });
});
