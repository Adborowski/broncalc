import { expect, it } from "vitest";
import { analyseRecipe, newRow } from "./recipe";

it("splits a recipe into mix SG, parts and the materials worth warning about", () => {
  const a = analyseRecipe([
    newRow("feldspar_potash", "45"),
    newRow("silica", "30"),
    newRow("bentonite", "2"),
    newRow("lithium_carbonate", "3"),
    newRow("soda_ash", "20"),
    newRow("", "10"), // no material yet
    newRow("kaolin", ""), // no amount yet
  ]);
  expect(a.parts.map((p) => p.name)).toHaveLength(5);
  expect(a.parts.reduce((s, p) => s + p.fraction, 0)).toBeCloseTo(1, 9);
  expect(a.excluded.map((m) => m.id)).toEqual(["soda_ash"]);
  expect(a.excludedShare).toBeCloseTo(0.2, 9);
  expect(a.caution.map((m) => m.id)).toEqual(["bentonite", "lithium_carbonate"]);
  // Bentonite is variable, not soluble.
  expect(a.soluble.map((m) => m.id)).toEqual(["lithium_carbonate", "soda_ash"]);
  expect(a.mix).not.toBeNull();
});

it("has no mix SG until something is filled in", () => {
  expect(analyseRecipe([newRow()]).mix).toBeNull();
});
