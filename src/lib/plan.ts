/**
 * What it takes to bring a weighed batch of slurry to a target SG. Shared by
 * the on-screen advice and the printable plan so they can never disagree.
 */
import { dryToAdd, powderVolume, waterToAdd, waterToRemove } from "./brongniart";

export type Plan =
  | { kind: "on-target" }
  | { kind: "thin"; water: number; reading: number }
  | {
      kind: "thicken";
      /** null when the target is above the powder's own SG. */
      powder: { grams: number; volumeMl: number; reading: number } | null;
      removeWater: { grams: number; reading: number };
    };

/** All masses in grams; `slurryGrams` is the batch without its bucket. */
export function planAdjustment(current: number, target: number, powderSG: number, slurryGrams: number): Plan {
  if (Math.abs(current - target) < 0.0005) return { kind: "on-target" };
  const volume = slurryGrams / current;
  if (target < current) {
    const water = waterToAdd(volume, current, target);
    return { kind: "thin", water, reading: slurryGrams + water };
  }
  const dry = dryToAdd(volume, current, target, powderSG);
  const removed = waterToRemove(volume, current, target);
  return {
    kind: "thicken",
    powder: dry == null ? null : { grams: dry, volumeMl: powderVolume(dry, powderSG), reading: slurryGrams + dry },
    removeWater: { grams: removed, reading: slurryGrams - removed },
  };
}
