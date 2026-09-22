/**
 * Brongniart's formula and the arithmetic around it.
 *
 * Everything is metric and per millilitre / gram, with water taken as
 * 1 g/mL. A slurry of volume V (mL) weighing M (g) holds D grams of solids of
 * particle SG s, because its mass and its volume both split into solids and
 * water:
 *
 *   M = D + W        V = D/s + W        ⇒   D = (M − V) · s / (s − 1)
 */

/** Brongniart's factor s / (s − 1). */
export function factor(dryPowderSG: number): number {
  return dryPowderSG / (dryPowderSG - 1);
}

export interface SlurryContent {
  /** Grams of dry solids in one litre of slurry. */
  dryPerLitre: number;
  /** Grams of water in one litre of slurry. */
  waterPerLitre: number;
  /** Solids as a fraction of slurry weight (0–1). */
  solidsFraction: number;
  /** Water per 100 g of dry material, the way recipes state it. */
  waterPer100Dry: number;
}

/**
 * What one litre of slurry holds. Returns null for physically impossible
 * inputs: a slurry lighter than water, or heavier than its own powder.
 */
export function slurryContent(sg: number, dryPowderSG: number): SlurryContent | null {
  if (!(sg > 1) || !(dryPowderSG > 1) || sg >= dryPowderSG) return null;
  const litreGrams = sg * 1000;
  const dryPerLitre = (litreGrams - 1000) * factor(dryPowderSG);
  const waterPerLitre = litreGrams - dryPerLitre;
  return {
    dryPerLitre,
    waterPerLitre,
    solidsFraction: dryPerLitre / litreGrams,
    waterPer100Dry: (waterPerLitre / dryPerLitre) * 100,
  };
}

/**
 * Water (mL = g) to add to `volumeMl` of slurry to bring it down to
 * `targetSG`. Needs no powder SG: adding water adds equal mass and volume.
 */
export function waterToAdd(volumeMl: number, currentSG: number, targetSG: number): number {
  return (volumeMl * (currentSG - targetSG)) / (targetSG - 1);
}

/**
 * Water (mL = g) to take out of `volumeMl` of slurry, by pouring off or
 * evaporating, to bring it up to `targetSG`. Like thinning, it needs no
 * powder SG.
 */
export function waterToRemove(volumeMl: number, currentSG: number, targetSG: number): number {
  return (volumeMl * (targetSG - currentSG)) / (targetSG - 1);
}

/**
 * Dry glaze powder (g) to add to `volumeMl` of slurry to bring it up to
 * `targetSG`. Unlike thinning, this depends on the powder SG, because the
 * powder adds mass and volume in the ratio SG : 1.
 */
export function dryToAdd(volumeMl: number, currentSG: number, targetSG: number, dryPowderSG: number): number | null {
  if (targetSG >= dryPowderSG) return null;
  return (volumeMl * (targetSG - currentSG)) / (1 - targetSG / dryPowderSG);
}

/** Volume (mL) that `grams` of powder add once wetted. */
export function powderVolume(grams: number, dryPowderSG: number): number {
  return grams / dryPowderSG;
}

export interface MixPart {
  /** Any unit; parts are normalised. */
  amount: number;
  sg: number;
  low: number;
  high: number;
}

export interface MixSG {
  sg: number;
  low: number;
  high: number;
}

/**
 * Mix SG as a mass-weighted harmonic mean: each material contributes
 * its volume, mass / SG. A plain average of SGs would be wrong.
 */
export function mixSG(parts: MixPart[]): MixSG | null {
  const valid = parts.filter((p) => p.amount > 0 && p.sg > 0);
  const total = valid.reduce((sum, p) => sum + p.amount, 0);
  if (total <= 0) return null;
  const harmonic = (pick: (p: MixPart) => number) => total / valid.reduce((sum, p) => sum + p.amount / pick(p), 0);
  return { sg: harmonic((p) => p.sg), low: harmonic((p) => p.low), high: harmonic((p) => p.high) };
}

/** Accepts "1,45" as well as "1.45"; empty or junk is NaN. */
export function parseNumber(text: string): number {
  const cleaned = text.trim().replace(",", ".");
  return cleaned === "" ? NaN : Number(cleaned);
}
