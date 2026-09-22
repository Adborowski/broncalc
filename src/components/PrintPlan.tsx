import type { PlannedResult } from "../lib/calculate";
import { GLAZY_SUPPORT_URL, type GlazySource } from "../lib/glazy";
import type { RecipeAnalysis } from "../lib/recipe";
import type { Mode } from "./Masthead";
import { fmt, fmtMass, fmtPercent, pourOffWarning } from "./ui";

/**
 * The one-page plan for the studio wall. Hidden on screen, it is the only
 * thing printed (see @media print in styles.css), so "Save as PDF" in the
 * browser's print dialog gives the same page.
 */
export function PrintPlan({
  name,
  result,
  mode,
  recipe,
  source,
}: {
  name: string;
  result: PlannedResult;
  mode: Mode;
  /** Recipe mode only. */
  recipe: RecipeAnalysis | null;
  /** Where the recipe came from, if it was imported. */
  source: GlazySource | null;
}) {
  const { slurry: current, powder, content, adjustment } = result;
  const { plan, slurryGrams, target } = adjustment;
  const solidsFraction = content.solidsFraction;
  const powderSGSource = mode === "simple" ? "typical glaze average" : "from recipe";
  const parts = recipe?.parts;
  const soluble = recipe ? recipe.soluble.map((m) => m.name) : [];

  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const check = (
    <li>
      Check: stir, then weigh 100 mL of glaze. It should weigh <strong>{fmt(target * 100)} g</strong>.
    </li>
  );

  return (
    <div className="print-plan" aria-hidden="true">
      <header className="pp-head">
        <p className="pp-eyebrow">Glaze adjustment plan · {date}</p>
        <h1>{name.trim() || "Glaze"}</h1>
      </header>

      <table className="pp-facts">
        <tbody>
          <tr>
            <th>Slurry SG now</th>
            <td>{fmt(current, 3)}</td>
            <th>Target SG</th>
            <td>{fmt(target, 3)}</td>
          </tr>
          <tr>
            <th>Slurry weight</th>
            <td>{fmtMass(slurryGrams)}</td>
            <th>Powder SG</th>
            <td>
              {fmt(powder.sg, 2)} <span className="pp-muted">({powderSGSource})</span>
            </td>
          </tr>
          {parts && parts.length > 0 && (
            <tr>
              <th>Recipe</th>
              <td colSpan={3} className="pp-recipe">
                {parts.map((p) => `${p.name} ${fmtPercent(p.fraction)}`).join(" · ")}
                {source && (
                  <>
                    <span className="pp-source">
                      From Glazy: {source.name}
                      {source.author && ` by ${source.author}`} ({source.url.replace("https://", "")}), CC BY-NC-SA 4.0
                    </span>
                    <span className="pp-source">
                      Glazy is a free, open recipe library kept running by its community. Support it at{" "}
                      {GLAZY_SUPPORT_URL.replace("https://", "")}
                    </span>
                  </>
                )}
              </td>
            </tr>
          )}
          <tr>
            <th>Holds</th>
            <td colSpan={3}>
              {fmtMass(slurryGrams * solidsFraction)} powder, {fmtMass(slurryGrams * (1 - solidsFraction))} water
            </td>
          </tr>
        </tbody>
      </table>

      <p className="pp-note">
        All weights are the slurry alone. Tare the bucket before filling it, or subtract its weight.
      </p>

      {plan.kind === "on-target" && <p className="pp-big">Already on target. Nothing to do.</p>}

      {plan.kind === "thin" && (
        <section className="pp-section">
          <h2>Too thick: add water</h2>
          <ol className="pp-steps">
            <li>Stir the glaze well.</li>
            <li>
              Add <strong>{fmtMass(plan.water)} water</strong>. The scale should read{" "}
              <strong>{fmtMass(plan.reading)}</strong>.
            </li>
            <li>Stir thoroughly, for at least 2 minutes.</li>
            {check}
          </ol>
        </section>
      )}

      {plan.kind === "thicken" && (
        <>
          <p className="pp-intro">Too thin. Use either option.</p>
          <section className="pp-section">
            <h2>Option 1: add glaze powder</h2>
            {plan.powder == null ? (
              <p>The target is above the powder's own SG, so it can't be reached by adding powder.</p>
            ) : (
              <ol className="pp-steps">
                {parts && parts.length > 1 ? (
                  <li>
                    Weigh out <strong>{fmtMass(plan.powder.grams)} dry glaze</strong>, in these amounts:
                    <ul className="pp-checklist">
                      {parts.map((p) => (
                        <li key={p.name}>
                          <span className="pp-box">☐</span>
                          <span className="pp-item">{p.name}</span>
                          <span className="pp-num">{fmtMass(plan.powder!.grams * p.fraction)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li>
                    Weigh out <strong>{fmtMass(plan.powder.grams)} dry glaze</strong>.
                  </li>
                )}
                <li>
                  Mix it into the slurry. The scale should read <strong>{fmtMass(plan.powder.reading)}</strong>.
                </li>
                <li>Stir thoroughly, and sieve if you normally would.</li>
                {check}
              </ol>
            )}
          </section>

          <section className="pp-section">
            <h2>Option 2: remove water</h2>
            <ol className="pp-steps">
              <li>Let the glaze settle, ideally overnight.</li>
              <li>
                Pour off clear water until the scale reads <strong>{fmtMass(plan.removeWater.reading)}</strong> (
                {fmtMass(plan.removeWater.grams)} removed). Evaporating also works, but slowly.
              </li>
              <li>Scrape down the sides and stir thoroughly.</li>
              {check}
            </ol>
            {soluble.length > 0 && <p className="pp-note">{pourOffWarning(soluble)}</p>}
          </section>
        </>
      )}

      <section className="pp-section">
        <h2>Notes</h2>
        <div className="pp-lines">
          <span />
          <span />
          <span />
        </div>
      </section>
    </div>
  );
}
