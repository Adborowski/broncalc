/**
 * Flattens data/materials-sg.json (materials, their variants, and stain
 * families) into one list of pickable options.
 */
import data from "../../data/materials-sg.json";

export type Confidence = "high" | "medium" | "low";
export type Solubility = "insoluble" | "slight" | "soluble";
export type BrongniartUse = "ok" | "caution" | "invalid" | "n/a";

export interface Material {
  id: string;
  name: string;
  category: string;
  formula: string | null;
  sg: number;
  low: number;
  high: number;
  confidence: Confidence;
  solubility: Solubility;
  use: BrongniartUse;
  basis?: string;
  notes?: string;
  /** Set for variants: the id of the material they belong to. */
  parent?: string;
}

interface RawVariant {
  key: string;
  name: string;
  formula?: string;
  sg: number;
  sg_range: number[];
  confidence: string;
  notes?: string;
}

interface RawMaterial {
  key: string;
  name: string;
  category: string;
  formula?: string | null;
  sg: number | null;
  sg_range?: number[];
  confidence?: string;
  basis?: string;
  solubility?: string;
  brongniart: string;
  notes?: string;
  variants?: RawVariant[];
}

interface RawFamily {
  name: string;
  sg: number;
  sg_range: number[];
  host: string;
}

export const CATEGORY_NAMES: Record<string, string> = {
  clay: "Clays",
  silica: "Silica & glass",
  feldspar: "Feldspars & fluxes",
  frit: "Frits",
  boron: "Boron sources",
  carbonate: "Carbonates & alkaline earths",
  ash: "Ashes & rock powders",
  colourant: "Colourants",
  stain: "Stains (by family)",
  opacifier: "Opacifiers",
  refractory: "Refractories",
  studio: "Studio additives",
};

function build(): Material[] {
  const out: Material[] = [];
  for (const m of data.materials as RawMaterial[]) {
    if (m.sg == null || !m.sg_range) continue;
    const base: Material = {
      id: m.key,
      name: m.name,
      category: m.category,
      formula: m.formula ?? null,
      sg: m.sg,
      low: m.sg_range[0],
      high: m.sg_range[1],
      confidence: m.confidence as Confidence,
      solubility: (m.solubility ?? "insoluble") as Solubility,
      use: m.brongniart as BrongniartUse,
      basis: m.basis,
      notes: m.notes,
    };
    out.push(base);
    for (const v of m.variants ?? []) {
      out.push({
        ...base,
        id: v.key,
        name: v.name,
        formula: v.formula ?? base.formula,
        sg: v.sg,
        low: v.sg_range[0],
        high: v.sg_range[1],
        confidence: v.confidence as Confidence,
        basis: undefined,
        notes: v.notes,
        parent: m.key,
      });
    }
  }
  const { $comment: _c, colour_hint: _h, ...families } = data.stain_families as Record<string, unknown>;
  for (const [key, raw] of Object.entries(families)) {
    const f = raw as RawFamily;
    out.push({
      id: `stain_${key}`,
      name: f.name,
      category: "stain",
      formula: null,
      sg: f.sg,
      low: f.sg_range[0],
      high: f.sg_range[1],
      confidence: "low",
      solubility: "insoluble",
      use: "ok",
      basis: `Host crystal: ${f.host}.`,
    });
  }
  return out;
}

export const MATERIALS: Material[] = build();
export const MATERIAL_BY_ID = new Map(MATERIALS.map((m) => [m.id, m]));

function haystack(m: Material): string {
  return `${m.name} ${m.formula ?? ""} ${m.id.replace(/_/g, " ")} ${CATEGORY_NAMES[m.category] ?? ""}`.toLowerCase();
}

/**
 * Materials matching every word of `query` (name, formula, key, category).
 * Names that start with the query rank first, then names containing it.
 */
export function searchMaterials(query: string, materials: Material[] = MATERIALS): Material[] {
  const q = query.trim().toLowerCase();
  if (!q) return materials;
  const words = q.split(/\s+/);
  const rank = (m: Material) => {
    const name = m.name.toLowerCase();
    return name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2;
  };
  return materials
    .filter((m) => words.every((w) => haystack(m).includes(w)))
    .map((m, i) => ({ m, i, r: rank(m) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.m);
}
