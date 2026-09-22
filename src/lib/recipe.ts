import { mixSG, parseNumber, type MixSG } from "./brongniart";
import { MATERIAL_BY_ID, type Material } from "./materials";

export interface RecipeRow {
  id: string;
  materialId: string;
  /** As typed; parsed here. */
  amount: string;
  /** The ingredient's name where it came from (e.g. Glazy), shown while no material is chosen. */
  sourceName?: string;
}

export interface Part {
  name: string;
  /** Share of the whole recipe, 0–1. */
  fraction: number;
}

export interface RecipeAnalysis {
  /** Null until at least one counted material has an amount. */
  mix: MixSG | null;
  /** Every ingredient in proportion, soluble ones included: topping up means adding more of the same glaze. */
  parts: Part[];
  /** Dissolve outright, so they're left out of the mix SG. */
  excluded: Material[];
  /** Partly soluble or highly variable (includes insoluble-but-variable bentonite). */
  caution: Material[];
  /** Actually dissolve, fully or slightly: lost when water is poured off. */
  soluble: Material[];
  /** SG is an estimate, with no published figure. */
  estimated: Material[];
  /** Share of the recipe (0–1) that is excluded. */
  excludedShare: number;
}

export function newRow(materialId = "", amount = ""): RecipeRow {
  return { id: Math.random().toString(36).slice(2, 10), materialId, amount };
}

export function analyseRecipe(rows: RecipeRow[]): RecipeAnalysis {
  const picked = rows
    .map((r) => ({ m: MATERIAL_BY_ID.get(r.materialId), amount: parseNumber(r.amount) }))
    .filter((r): r is { m: Material; amount: number } => !!r.m && r.amount > 0);
  const total = picked.reduce((sum, r) => sum + r.amount, 0);
  const counted = picked.filter((r) => r.m.use !== "invalid");
  const excluded = picked.filter((r) => r.m.use === "invalid");

  return {
    mix: mixSG(counted.map((r) => ({ amount: r.amount, sg: r.m.sg, low: r.m.low, high: r.m.high }))),
    parts: picked.map((r) => ({ name: r.m.name, fraction: r.amount / total })),
    excluded: excluded.map((r) => r.m),
    caution: picked.filter((r) => r.m.use === "caution").map((r) => r.m),
    soluble: picked.filter((r) => r.m.solubility !== "insoluble").map((r) => r.m),
    estimated: picked.filter((r) => r.m.confidence === "low").map((r) => r.m),
    excludedShare: total > 0 ? excluded.reduce((sum, r) => sum + r.amount, 0) / total : 0,
  };
}
