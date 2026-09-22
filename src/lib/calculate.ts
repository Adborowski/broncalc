/**
 * Everything the page shows, derived from the inputs in one place. The
 * result is a tagged union so each section asks one question ("is it ok?")
 * instead of re-checking every input itself.
 */
import { slurryContent, type MixSG, type SlurryContent } from "./brongniart";
import { planAdjustment, type Plan } from "./plan";

/**
 * Simplified mode's powder SG. 2.5 is the figure potters conventionally use
 * for glazes; the range covers most real mixes, from frit-heavy (≈2.4) to
 * whiting/wollastonite-heavy (≈2.7).
 */
export const TYPICAL_POWDER: MixSG = { sg: 2.5, low: 2.4, high: 2.7 };

export interface Inputs {
  /** Slurry SG; NaN when empty or unreadable. */
  slurry: number;
  /** Powder SG with its low–high range; null when a recipe gives nothing yet. */
  powder: MixSG | null;
  /** Target slurry SG; NaN when empty. */
  target: number;
  /** Slurry weight without the bucket; NaN when empty. */
  slurryKg: number;
}

export type Adjustment =
  | { status: "ok"; plan: Plan; slurryGrams: number; target: number }
  | { status: "needs-target" }
  | { status: "needs-weight" };

export type Calculation =
  | { status: "incomplete" }
  | { status: "invalid"; problem: string }
  | {
      status: "ok";
      slurry: number;
      powder: MixSG;
      content: SlurryContent;
      /** What the result would be at each end of the powder SG range; null when there's no range. */
      range: { atLowSG: SlurryContent; atHighSG: SlurryContent } | null;
      /** Known when the weight is entered. */
      slurryGrams: number | null;
      adjustment: Adjustment;
    };

export function calculate({ slurry, powder, target, slurryKg }: Inputs): Calculation {
  if (!(slurry > 0)) return { status: "incomplete" };
  if (slurry <= 1) return { status: "invalid", problem: "A slurry can't be lighter than water. SG must be above 1." };
  if (!powder) return { status: "incomplete" };
  if (slurry >= powder.sg)
    return { status: "invalid", problem: "The slurry is heavier than the powder it's made of. Check the inputs." };

  // Past the checks above, slurryContent can't return null.
  const content = slurryContent(slurry, powder.sg)!;
  const range =
    powder.high - powder.low > 0.001
      ? { atLowSG: slurryContent(slurry, powder.low)!, atHighSG: slurryContent(slurry, powder.high)! }
      : null;
  const slurryGrams = slurryKg > 0 ? slurryKg * 1000 : null;

  return {
    status: "ok",
    slurry,
    powder,
    content,
    range,
    slurryGrams,
    adjustment: adjust(slurry, powder, target, slurryGrams),
  };
}

function adjust(slurry: number, powder: MixSG, target: number, slurryGrams: number | null): Adjustment {
  if (!(target > 1)) return { status: "needs-target" };
  if (slurryGrams == null) return { status: "needs-weight" };
  return { status: "ok", plan: planAdjustment(slurry, target, powder.sg, slurryGrams), slurryGrams, target };
}

/** A calculation that went through, for components that only render then. */
export type Result = Extract<Calculation, { status: "ok" }>;
/** A result with a complete adjustment plan. */
export type PlannedResult = Result & { adjustment: Extract<Adjustment, { status: "ok" }> };

export function isPlanned(calc: Calculation): calc is PlannedResult {
  return calc.status === "ok" && calc.adjustment.status === "ok";
}
