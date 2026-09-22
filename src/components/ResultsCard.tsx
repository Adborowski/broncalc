import { TYPICAL_POWDER, type Calculation, type Result } from "../lib/calculate";
import type { Mode } from "./Masthead";
import { Card, PrintRow, fmt, fmtMass } from "./ui";

export function ResultsCard({
  calc,
  mode,
  onPrintLabel,
  hasName,
}: {
  calc: Calculation;
  mode: Mode;
  onPrintLabel: () => void;
  /** Whether the glaze has a name to title the label with. */
  hasName: boolean;
}) {
  return (
    <Card title="What's in it">
      {calc.status === "ok" ? (
        <>
          <Results result={calc} mode={mode} />
          <PrintRow label="Print label" onPrint={onPrintLabel}>
            A bucket label to cut out and laminate.
            {!hasName && " Add a glaze name in step 1 to title it."}
          </PrintRow>
        </>
      ) : (
        <p className="empty">
          {mode === "simple"
            ? "Enter your slurry SG to see what's in it."
            : "Enter your slurry SG and a recipe to see what's in it."}
        </p>
      )}
    </Card>
  );
}

/**
 * The big numbers are for the whole batch when its weight is known, and per
 * kilo of slurry otherwise; the other rates are listed underneath.
 */
function Results({ result, mode }: { result: Result; mode: Mode }) {
  const { content, range, slurryGrams, slurry } = result;
  const share = content.solidsFraction;
  // Grams of slurry the big numbers describe: the whole batch, or one kilo.
  const basis = slurryGrams ?? 1000;
  const unit = slurryGrams != null ? "in your bucket" : "per kg of slurry";
  // Units always sit with the number ("517 g", "5.95 kg").
  const show = fmtMass;

  return (
    <>
      {slurryGrams != null && <p className="heroes-caption">Your {fmtMass(slurryGrams)} of slurry holds</p>}
      <div className="heroes">
        <Hero kind="powder" label="Powder" value={show(basis * share)} unit={unit} />
        <Hero kind="water" label="Water" value={show(basis * (1 - share))} unit={unit} />
      </div>
      {range && (
        <p className="hero-range">
          Powder {rangeText(show(basis * range.atHighSG.solidsFraction), show(basis * range.atLowSG.solidsFraction))}{" "}
          {mode === "simple"
            ? `if your powder SG is anywhere from ${fmt(TYPICAL_POWDER.low, 1)} to ${fmt(TYPICAL_POWDER.high, 1)}`
            : "across the SG range of your ingredients"}
          ; water makes up the rest.
        </p>
      )}
      <dl className="stats">
        {slurryGrams != null && (
          <Stat
            wide
            label="Per kg of slurry"
            value={`${fmt(share * 1000)} g powder, ${fmt((1 - share) * 1000)} g water`}
          />
        )}
        <Stat
          wide
          label="Per litre of slurry"
          value={`${fmt(content.dryPerLitre)} g powder, ${fmt(content.waterPerLitre)} g water`}
        />
        <Stat label="Water per 100 g powder" value={`${fmt(content.waterPer100Dry, 1)} g`} />
        <Stat label="Slurry SG" value={fmt(slurry, 3)} />
      </dl>
    </>
  );
}

/** "5.67 kg" and "6.12 kg" → "5.67–6.12 kg"; mixed units keep both. */
function rangeText(low: string, high: string): string {
  const unit = (s: string) => s.split(" ")[1] ?? "";
  return unit(low) === unit(high) ? `${low.split(" ")[0]}–${high}` : `${low}–${high}`;
}

function Hero({ kind, label, value, unit }: { kind: "powder" | "water"; label: string; value: string; unit: string }) {
  // "5.95 kg" → big "5.95" with a smaller "kg".
  const [num, suffix] = value.split(" ");
  return (
    <div className={`hero hero-${kind}`}>
      <span className="hero-label">{label}</span>
      <span className="hero-num">
        {num}
        {suffix && <span className="hero-suffix"> {suffix}</span>}
      </span>
      <span className="hero-unit">{unit}</span>
    </div>
  );
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "stat-wide" : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
