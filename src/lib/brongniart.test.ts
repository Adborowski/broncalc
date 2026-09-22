import { describe, expect, it } from "vitest";
import { dryToAdd, mixSG, parseNumber, slurryContent, waterToAdd, waterToRemove } from "./brongniart";

describe("slurryContent", () => {
  it("gives the textbook answer: SG 1.45 slurry of SG 2.5 powder", () => {
    const c = slurryContent(1.45, 2.5)!;
    expect(c.dryPerLitre).toBeCloseTo(750, 6);
    expect(c.waterPerLitre).toBeCloseTo(700, 6);
    expect(c.solidsFraction).toBeCloseTo(750 / 1450, 6);
  });

  it("round-trips a mix made from known amounts", () => {
    // 600 g of SG 2.65 powder + 500 g water: volume 500 + 600/2.65 mL.
    const volume = 500 + 600 / 2.65;
    const c = slurryContent(1100 / volume, 2.65)!;
    expect(c.dryPerLitre * (volume / 1000)).toBeCloseTo(600, 6);
  });

  it("rejects impossible slurries", () => {
    expect(slurryContent(0.98, 2.5)).toBeNull();
    expect(slurryContent(2.6, 2.5)).toBeNull();
    expect(slurryContent(NaN, 2.5)).toBeNull();
  });
});

describe("adjustments", () => {
  it("thinning to target lands on the target SG", () => {
    const water = waterToAdd(1000, 1.6, 1.45);
    expect((1600 + water) / (1000 + water)).toBeCloseTo(1.45, 9);
  });

  it("thickening to target lands on the target SG", () => {
    const dry = dryToAdd(1000, 1.35, 1.45, 2.6)!;
    expect((1350 + dry) / (1000 + dry / 2.6)).toBeCloseTo(1.45, 9);
  });

  it("removing water to target lands on the target SG", () => {
    // 10 kg of slurry at 1.40.
    const volume = 10000 / 1.4;
    const water = waterToRemove(volume, 1.4, 1.5);
    expect((10000 - water) / (volume - water)).toBeCloseTo(1.5, 9);
    expect(water).toBeCloseTo(1428.6, 1);
  });

  it("cannot thicken past the powder's own SG", () => {
    expect(dryToAdd(1000, 1.4, 2.7, 2.6)).toBeNull();
  });
});

describe("mixSG", () => {
  it("is a harmonic mean, not an arithmetic one", () => {
    const m = mixSG([
      { amount: 90, sg: 2.6, low: 2.6, high: 2.6 },
      { amount: 10, sg: 4.6, low: 4.6, high: 4.6 },
    ])!;
    expect(m.sg).toBeCloseTo(1 / (0.9 / 2.6 + 0.1 / 4.6), 9);
    expect(m.sg).toBeLessThan(0.9 * 2.6 + 0.1 * 4.6);
  });

  it("normalises parts and ignores empty rows", () => {
    const a = mixSG([{ amount: 1, sg: 2.5, low: 2.4, high: 2.6 }])!;
    const b = mixSG([
      { amount: 40, sg: 2.5, low: 2.4, high: 2.6 },
      { amount: 0, sg: 7, low: 7, high: 7 },
    ])!;
    expect(b).toEqual(a);
    expect(mixSG([])).toBeNull();
  });
});

it("parseNumber", () => {
  expect(parseNumber("1,45")).toBe(1.45);
  expect(parseNumber("")).toBeNaN();
});
