import { describe, expect, it } from "vitest";
import { planAdjustment } from "./plan";

describe("planAdjustment", () => {
  it("thins with water and quotes the new scale reading", () => {
    const p = planAdjustment(1.45, 1.4, 2.5, 11500);
    expect(p.kind).toBe("thin");
    if (p.kind !== "thin") return;
    expect(p.water).toBeCloseTo(991.4, 1);
    expect(p.reading).toBeCloseTo(11500 + p.water, 9);
  });

  it("offers both thickening options", () => {
    const p = planAdjustment(1.45, 1.55, 2.628, 11500);
    expect(p.kind).toBe("thicken");
    if (p.kind !== "thicken") return;
    expect(p.powder!.grams).toBeCloseTo(1933.5, 0);
    expect(p.removeWater.reading).toBeCloseTo(11500 - p.removeWater.grams, 9);
  });

  it("recognises a slurry already on target", () => {
    expect(planAdjustment(1.45, 1.4502, 2.5, 10000).kind).toBe("on-target");
  });
});
