import { useMemo } from "react";
import { parseNumber } from "./lib/brongniart";
import { TYPICAL_POWDER, calculate, isPlanned } from "./lib/calculate";
import { analyseRecipe, newRow, type RecipeRow } from "./lib/recipe";
import { usePersistentState } from "./lib/usePersistentState";
import { AdjustCard } from "./components/AdjustCard";
import { Masthead, type Mode } from "./components/Masthead";
import { PowderCard } from "./components/PowderCard";
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
        <Masthead mode={mode} onModeChange={setMode} />

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
            />
            <AdjustCard target={targetSG} onTargetChange={setTargetSG} calc={calc} recipe={activeRecipe} />
          </div>
          <div className="col col-results">
            <ResultsCard calc={calc} mode={mode} />
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

      {isPlanned(calc) && <PrintPlan name={glazeName} result={calc} mode={mode} recipe={activeRecipe} />}
    </>
  );
}
