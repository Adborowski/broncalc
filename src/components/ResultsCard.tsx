import { TYPICAL_POWDER, type Calculation, type Result } from "../lib/calculate";
import type { Mode } from "./Masthead";
import { Card, fmt, fmtMass } from "./ui";

export function ResultsCard({ calc, mode }: { calc: Calculation; mode: Mode }) {
  return (
    <Card title="What's in it">
      {calc.status === "ok" ? (
        <Results result={calc} mode={mode} />
      ) : (
        <p className="empty">Enter a slurry sample and a powder SG to see the result.</p>
      )}
    </Card>
  );
}

function Results({ result, mode }: { result: Result; mode: Mode }) {
  const { content, range, slurryGrams, slurry } = result;
  const powderShare = content.solidsFraction;
  return (
    <>
      <div className="heroes">
        <Hero kind="powder" label="Powder" grams={powderShare * 1000} />
        <Hero kind="water" label="Water" grams={(1 - powderShare) * 1000} />
      </div>
      {range && (
        <p className="hero-range">
          Powder {fmt(range.atHighSG.solidsFraction * 1000)}–{fmt(range.atLowSG.solidsFraction * 1000)} g{" "}
          {mode === "simple"
            ? `if your powder SG is anywhere from ${fmt(TYPICAL_POWDER.low, 1)} to ${fmt(TYPICAL_POWDER.high, 1)}`
            : "across the SG range of your ingredients"}
          ; water makes up the rest of the kilo.
        </p>
      )}
      {slurryGrams != null && (
        <p className="batch">
          Your {fmtMass(slurryGrams)} of slurry holds{" "}
          <strong className="batch-powder">{fmtMass(slurryGrams * powderShare)} powder</strong> and{" "}
          <strong className="batch-water">{fmtMass(slurryGrams * (1 - powderShare))} water</strong>.
        </p>
      )}
      <dl className="stats">
        <Stat label="Water per 100 g powder" value={`${fmt(content.waterPer100Dry, 1)} g`} />
        <Stat label="Slurry SG" value={fmt(slurry, 3)} />
      </dl>
      <p className="per-litre">
        Per litre of slurry: {fmt(content.dryPerLitre)} g powder, {fmt(content.waterPerLitre)} g water.
      </p>
    </>
  );
}

function Hero({ kind, label, grams }: { kind: "powder" | "water"; label: string; grams: number }) {
  return (
    <div className={`hero hero-${kind}`}>
      <span className="hero-label">{label}</span>
      <span className="hero-num">{fmt(grams)}</span>
      <span className="hero-unit">g per kg of slurry</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
