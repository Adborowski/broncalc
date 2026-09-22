import { Segmented } from "./ui";

export type Mode = "simple" | "recipe";

const MODES: { value: Mode; label: string }[] = [
  { value: "simple", label: "Simplified" },
  { value: "recipe", label: "Advanced" },
];

export function Masthead({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
  return (
    <header className="masthead">
      <p className="eyebrow">Glaze slurry calculator</p>
      <h1>Welcome to BronCalc</h1>
      <p className="lede">
        Weigh a known volume of glaze and find out how much dry material is in
        it, and how much water or powder brings it to your target.
      </p>
      <Segmented
        value={mode}
        options={MODES}
        onChange={onModeChange}
        label="Calculation mode"
        className="mode-switch"
      />
    </header>
  );
}
