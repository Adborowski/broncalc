import { TYPICAL_POWDER } from "../lib/calculate";
import type { RecipeAnalysis, RecipeRow } from "../lib/recipe";
import type { Mode } from "./Masthead";
import { RecipeEditor } from "./RecipeEditor";
import { Card, Note, fmt, listJoin } from "./ui";

export function PowderCard({
  mode,
  rows,
  onRowsChange,
  recipe,
  onUseRecipe,
}: {
  mode: Mode;
  rows: RecipeRow[];
  onRowsChange: (rows: RecipeRow[]) => void;
  recipe: RecipeAnalysis;
  onUseRecipe: () => void;
}) {
  return mode === "simple" ? (
    <AssumedPowder onUseRecipe={onUseRecipe} />
  ) : (
    <Card step="2" title="Dry powder SG">
      <RecipeEditor rows={rows} onChange={onRowsChange} />
      <MixSummary recipe={recipe} />
      <RecipeWarnings recipe={recipe} />
    </Card>
  );
}

function AssumedPowder({ onUseRecipe }: { onUseRecipe: () => void }) {
  const { sg, low, high } = TYPICAL_POWDER;
  return (
    <Card step="2" title="Dry powder SG" aside={<span className="assumed-tag">assumed</span>}>
      <p className="assumed">
        <span className="assumed-num">{fmt(sg, 1)}</span>
        <span className="muted">used automatically</span>
      </p>
      <p className="explain">
        The formula also needs the SG of the dry powder: the grains themselves, not the slurry. Common glaze materials
        sit close together (feldspars about 2.6, silica 2.65, kaolin 2.6, whiting 2.7, frits about 2.5), so potters use
        one average: <strong>2.5 for glazes</strong>. Most real glazes land between {fmt(low, 1)} and {fmt(high, 1)},
        and each 0.1 of difference moves the result by about 3%.
      </p>
      <Note>
        Glazes with a lot of zircon, tin, zinc or barium are heavier than this.{" "}
        <button type="button" className="btn-link inline" onClick={onUseRecipe}>
          Use From recipe
        </button>{" "}
        to calculate the powder SG from your ingredients.
      </Note>
    </Card>
  );
}

function MixSummary({ recipe: { mix } }: { recipe: RecipeAnalysis }) {
  if (!mix) return <Note>Add materials with amounts to calculate the mix SG.</Note>;
  return (
    <p className="derived">
      Mix SG <strong>{fmt(mix.sg, 3)}</strong>
      {mix.high - mix.low > 0.001 && (
        <span className="muted">
          {" "}
          (range {fmt(mix.low, 2)}–{fmt(mix.high, 2)})
        </span>
      )}
    </p>
  );
}

const names = (materials: { name: string }[]) => listJoin(materials.map((m) => m.name));

function RecipeWarnings({ recipe }: { recipe: RecipeAnalysis }) {
  const { excluded, excludedShare, caution, estimated } = recipe;
  return (
    <>
      {excluded.length > 0 && (
        <Note tone="error">
          Part of the recipe dissolves in water ({names(excluded)}), so it's left out of the mix SG. The formula doesn't
          count dissolved solids, so the result will read low by up to {fmt(excludedShare * 100, 1)}% of the recipe
          {excludedShare > 0.01 ? ". That's too much to ignore." : ", which is negligible."}
        </Note>
      )}
      {caution.length > 0 && (
        <Note tone="warn">
          Partly soluble or highly variable: {names(caution)}. Expect readings to come out slightly low and to drift as
          the slurry ages.
        </Note>
      )}
      {estimated.length > 0 && (
        <Note>
          Estimated SG (no published figure): {names(estimated)}. Measured values for your own materials would improve
          it.
        </Note>
      )}
    </>
  );
}
