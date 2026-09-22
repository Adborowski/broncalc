import { describe, expect, it } from "vitest";
import { calculate } from "./calculate";

const powder = { sg: 2.5, low: 2.4, high: 2.7 };

describe("calculate", () => {
  it("waits for a slurry SG", () => {
    expect(calculate({ slurry: NaN, powder, target: 1.4, slurryKg: 10 }).status).toBe("incomplete");
  });

  it("waits for a powder SG, but still rejects an impossible slurry", () => {
    expect(calculate({ slurry: 1.45, powder: null, target: 1.4, slurryKg: 10 }).status).toBe("incomplete");
    expect(calculate({ slurry: 0.9, powder: null, target: 1.4, slurryKg: 10 }).status).toBe("invalid");
  });

  it("rejects a slurry heavier than its powder", () => {
    expect(calculate({ slurry: 2.6, powder, target: 1.4, slurryKg: 10 }).status).toBe("invalid");
  });

  it("gives content and range, and says what the adjustment still needs", () => {
    const noWeight = calculate({ slurry: 1.45, powder, target: 1.4, slurryKg: NaN });
    if (noWeight.status !== "ok") throw new Error("expected ok");
    expect(noWeight.content.dryPerLitre).toBeCloseTo(750, 6);
    expect(noWeight.range!.atLowSG.dryPerLitre).toBeGreaterThan(noWeight.range!.atHighSG.dryPerLitre);
    expect(noWeight.adjustment.status).toBe("needs-weight");

    const noTarget = calculate({ slurry: 1.45, powder, target: NaN, slurryKg: 10 });
    expect(noTarget.status === "ok" && noTarget.adjustment.status).toBe("needs-target");
  });

  it("plans the adjustment once everything is in", () => {
    const c = calculate({ slurry: 1.45, powder, target: 1.4, slurryKg: 11.5 });
    if (c.status !== "ok" || c.adjustment.status !== "ok") throw new Error("expected a plan");
    expect(c.adjustment.plan.kind).toBe("thin");
  });

  it("has no range for a single fixed SG", () => {
    const c = calculate({ slurry: 1.45, powder: { sg: 2.5, low: 2.5, high: 2.5 }, target: 1.4, slurryKg: NaN });
    expect(c.status === "ok" && c.range).toBeNull();
  });
});
