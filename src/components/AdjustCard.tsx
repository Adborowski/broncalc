import type { Calculation } from "../lib/calculate";
import type { Plan } from "../lib/plan";
import type { Part, RecipeAnalysis } from "../lib/recipe";
import { Card, Field, Note, PrintRow, fmt, fmtMass, fmtVolume, isBadNumber, pourOffWarning } from "./ui";

export function AdjustCard({
  target,
  onTargetChange,
  calc,
  recipe,
  onPrint,
}: {
  target: string;
  onTargetChange: (v: string) => void;
  calc: Calculation;
  /** Recipe mode only: for the powder breakdown and soluble warnings. */
  recipe: RecipeAnalysis | null;
  onPrint: () => void;
}) {
  const adjustment = calc.status === "ok" ? calc.adjustment : null;
  return (
    <Card step="3" title="Adjust to a target" collapsible>
      <Field
        label="Target slurry SG"
        value={target}
        onChange={onTargetChange}
        invalid={isBadNumber(target, 1)}
        placeholder="1.40"
        hint="E.g. 1.40–1.50 for dipping, lower for spraying."
      />
      {adjustment?.status === "needs-weight" && (
        <Note>Enter the slurry weight in step 1 to see how much to add or remove.</Note>
      )}
      {adjustment?.status === "ok" && (
        <>
          <Advice plan={adjustment.plan} recipe={recipe} />
          <PrintRow label="Print plan" onPrint={onPrint}>
            A one-page version for the studio. Choose "Save as PDF" in the print dialog to keep a file.
          </PrintRow>
        </>
      )}
    </Card>
  );
}

function Advice({ plan, recipe }: { plan: Plan; recipe: RecipeAnalysis | null }) {
  switch (plan.kind) {
    case "on-target":
      return <Note>Already on target.</Note>;
    case "thin":
      return (
        <div className="advice">
          <Instruction verb="Add" amount={`${fmtMass(plan.water)} water`} reading={plan.reading} />
          <p className="muted small">
            This doesn't depend on the powder SG, because water adds the same weight as volume.
          </p>
        </div>
      );
    case "thicken":
      return (
        <div className="advice">
          <div className="option">
            <h3>Option 1: add glaze powder</h3>
            {plan.powder ? (
              <>
                <Instruction
                  verb="Add"
                  amount={`${fmtMass(plan.powder.grams)} dry glaze`}
                  reading={plan.powder.reading}
                />
                <p className="muted small">It will take up about {fmtVolume(plan.powder.volumeMl)} more.</p>
                {recipe && recipe.parts.length > 1 && <Breakdown parts={recipe.parts} grams={plan.powder.grams} />}
              </>
            ) : (
              <Note tone="error">Target is above the powder's own SG, so it can't be reached by adding powder.</Note>
            )}
          </div>
          <div className="option">
            <h3>Option 2: remove water</h3>
            <Instruction
              verb="Take out"
              amount={`${fmtMass(plan.removeWater.grams)} water`}
              reading={plan.removeWater.reading}
            />
            <p className="muted small">
              Fastest: let the glaze settle overnight and pour off the clear water. Evaporating also works but can take
              days; scrape the dried rim back in and stir before you weigh.
            </p>
            {recipe && recipe.soluble.length > 0 && (
              <Note tone="warn">{pourOffWarning(recipe.soluble.map((m) => m.name))}</Note>
            )}
          </div>
        </div>
      );
  }
}

/** "Add 991 g water, until the scale reads 12.49 kg." */
function Instruction({ verb, amount, reading }: { verb: string; amount: string; reading: number }) {
  return (
    <p className="advice-main">
      {verb} <strong>{amount}</strong>, until the scale reads <strong className="reading">{fmtMass(reading)}</strong>.
    </p>
  );
}

function Breakdown({ parts, grams }: { parts: Part[]; grams: number }) {
  return (
    <table className="breakdown">
      <tbody>
        {parts.map((p) => (
          <tr key={p.name}>
            <td>{p.name}</td>
            <td className="num">{fmt(p.fraction * 100, 1)}%</td>
            <td className="num strong">{fmtMass(grams * p.fraction)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
