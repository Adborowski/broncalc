import type { Result } from "../lib/calculate";
import type { GlazySource } from "../lib/glazy";
import type { RecipeAnalysis } from "../lib/recipe";
import { QrCode } from "./QrCode";
import { fmt, fmtMass, fmtPercent } from "./ui";

/** "Silica (quartz flour)" → "Silica": the label has room for the name, not the gloss. */
function shortName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, "");
}

/**
 * A bucket label: one A7 card (105 × 74 mm, the size of a common laminating
 * pouch) printed on A4 with a dashed cut line. Like the plan, it's hidden on
 * screen and is the only thing on the page when printed.
 */
export function PrintLabel({
  name,
  result,
  recipe,
  source,
}: {
  name: string;
  result: Result;
  /** Advanced mode only. */
  recipe: RecipeAnalysis | null;
  source: GlazySource | null;
}) {
  const { slurry, content, slurryGrams } = result;
  const share = content.solidsFraction;
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="print-label" aria-hidden="true">
      <div className="lb-card">
        <div className="lb-main">
          <h1 className="lb-name">{name.trim() || "Unnamed glaze"}</h1>
          {recipe && recipe.parts.length > 0 && (
            <p className="lb-recipe">{recipe.parts.map((p) => `${shortName(p.name)} ${fmtPercent(p.fraction)}`).join(" · ")}</p>
          )}

          <p className="lb-measured">Measured {date}</p>
          <div className="lb-facts">
            <span>
              SG <strong>{fmt(slurry, 2)}</strong>
            </span>
            {slurryGrams != null && (
              <span>
                <strong>{fmtMass(slurryGrams)}</strong> of slurry
              </span>
            )}
          </div>
          <p className="lb-holds">
            {slurryGrams != null ? (
              <>
                Holds <strong>{fmtMass(slurryGrams * share)}</strong> powder, {fmtMass(slurryGrams * (1 - share))} water
              </>
            ) : (
              <>
                Per kg: <strong>{fmt(share * 1000)} g</strong> powder, {fmt((1 - share) * 1000)} g water
              </>
            )}
          </p>
        </div>

        {source && (
          <div className="lb-qr">
            <QrCode value={source.url} label={`Glazy recipe: ${source.url}`} />
            <span>Scan for the recipe</span>
          </div>
        )}

        {source && (
          <p className="lb-credit">
            Recipe: {source.name}
            {source.author && ` by ${source.author}`}, from Glazy (CC BY-NC-SA 4.0). Glazy is free and runs on its
            community: help.glazy.org/support
          </p>
        )}
      </div>
      <p className="lb-cut">Cut along the dashed line. Laminate to protect it from water and glaze.</p>
    </div>
  );
}
