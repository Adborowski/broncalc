import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { parseNumber } from "./lib/brongniart";
import { TYPICAL_POWDER, calculate, isPlanned } from "./lib/calculate";
import { toRecipeRows, type GlazyRecipe, type GlazySource } from "./lib/glazy";
import { analyseRecipe, newRow, type RecipeRow } from "./lib/recipe";
import { usePersistentState } from "./lib/usePersistentState";
import { AdjustCard } from "./components/AdjustCard";
import { ClearAll } from "./components/ClearAll";
import { GlazyImportBar } from "./components/GlazyImport";
import { Masthead, type Mode } from "./components/Masthead";
import { PowderCard } from "./components/PowderCard";
import { PrintLabel } from "./components/PrintLabel";
import { PrintPlan } from "./components/PrintPlan";
import { ReferenceTable } from "./components/ReferenceTable";
import { ResultsCard } from "./components/ResultsCard";
import { SlurryCard } from "./components/SlurryCard";

const EXAMPLE_RECIPE: RecipeRow[] = [
  newRow("feldspar_potash", "40"),
  newRow("silica", "30"),
  newRow("whiting", "20"),
  newRow("kaolin", "10"),
];

export default function App() {
  // Inputs, as typed, kept across reloads.
  const [mode, setMode] = usePersistentState<Mode>("b.mode", "simple");
  const [glazeName, setGlazeName] = usePersistentState("b.name", "");
  const [slurrySG, setSlurrySG] = usePersistentState("b.slurrySG", "1.45");
  const [slurryKg, setSlurryKg] = usePersistentState("b.scaleKg", "");
  const [rows, setRows] = usePersistentState<RecipeRow[]>("b.recipe", EXAMPLE_RECIPE);
  const [targetSG, setTargetSG] = usePersistentState("b.targetSG", "1.40");
  const [glazySource, setGlazySource] = usePersistentState<GlazySource | null>("b.glazySource", null);

  // An import sets up everything it knows: the recipe, the name for the
  // printed plan, and Advanced mode, where the recipe is used.
  function importGlazy(recipe: GlazyRecipe) {
    setRows(toRecipeRows(recipe));
    setGlazySource({ id: recipe.id, name: recipe.name, author: recipe.author, url: recipe.url });
    setGlazeName(recipe.name);
    setMode("recipe");
  }
  // Empties every input. The mode stays: it's a preference, not an input.
  // Bumping resetKey remounts the import bar, clearing its link and message.
  const [resetKey, setResetKey] = useState(0);
  function clearAll() {
    setGlazeName("");
    setSlurrySG("");
    setSlurryKg("");
    setRows([newRow()]);
    setTargetSG("");
    setGlazySource(null);
    setResetKey((k) => k + 1);
  }

  // Which printout the hidden print sheet holds. It's rendered before the
  // dialog opens, so what the browser prints is always up to date.
  const [printing, setPrinting] = useState<"plan" | "label">("plan");
  function print(kind: "plan" | "label") {
    flushSync(() => setPrinting(kind));
    window.print();
  }

  // The credit stays while any imported ingredient is still in the recipe.
  const source = rows.some((r) => r.sourceName) ? glazySource : null;

  const recipe = useMemo(() => analyseRecipe(rows), [rows]);
  const activeRecipe = mode === "recipe" ? recipe : null;
  const calc = calculate({
    slurry: parseNumber(slurrySG),
    powder: activeRecipe ? activeRecipe.mix : TYPICAL_POWDER,
    target: parseNumber(targetSG),
    slurryKg: parseNumber(slurryKg),
  });

  return (
    <>
      <div className="page">
        <Masthead mode={mode} onModeChange={setMode}>
          <ClearAll onClear={clearAll} />
        </Masthead>
        <GlazyImportBar key={resetKey} onImported={importGlazy} />

        <main className="layout">
          <div className="col">
            <SlurryCard
              name={glazeName}
              onNameChange={setGlazeName}
              sg={slurrySG}
              onSGChange={setSlurrySG}
              weight={slurryKg}
              onWeightChange={setSlurryKg}
              problem={calc.status === "invalid" ? calc.problem : undefined}
            />
            <PowderCard
              mode={mode}
              rows={rows}
              onRowsChange={setRows}
              recipe={recipe}
              onUseRecipe={() => setMode("recipe")}
              source={source}
            />
            <AdjustCard
              target={targetSG}
              onTargetChange={setTargetSG}
              calc={calc}
              recipe={activeRecipe}
              onPrint={() => print("plan")}
            />
          </div>
          <div className="col col-results">
            <ResultsCard
              calc={calc}
              mode={mode}
              onPrintLabel={() => print("label")}
              hasName={glazeName.trim() !== ""}
            />
          </div>
        </main>

        <ReferenceTable />

        <footer className="foot">
          <p>
            dry = (slurry g/L − 1000) × SG ÷ (SG − 1). Mix SG is the mass-weighted harmonic mean of ingredient SGs.
            Values and sources: <code>data/materials-sg.json</code>.
          </p>
        </footer>
      </div>

      {printing === "label" && calc.status === "ok" && (
        <PrintLabel name={glazeName} result={calc} recipe={activeRecipe} source={activeRecipe ? source : null} />
      )}
      {printing === "plan" && isPlanned(calc) && (
        <PrintPlan
          name={glazeName}
          result={calc}
          mode={mode}
          recipe={activeRecipe}
          source={activeRecipe ? source : null}
        />
      )}
    </>
  );
}
