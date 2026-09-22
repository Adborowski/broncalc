import type { ReactNode } from "react";
import { Card, Field, Note, isBadNumber } from "./ui";

export function SlurryCard({
  name,
  onNameChange,
  sg,
  onSGChange,
  weight,
  onWeightChange,
  problem,
}: {
  name: string;
  onNameChange: (v: string) => void;
  sg: string;
  onSGChange: (v: string) => void;
  weight: string;
  onWeightChange: (v: string) => void;
  /** Why the slurry SG can't be used, if it can't. */
  problem?: string;
}) {
  return (
    <Card step="1" title="Your slurry">
      <Field
        label="Glaze name (optional)"
        value={name}
        onChange={onNameChange}
        placeholder="e.g. Celadon, bucket 3"
        hint="Only used as the title of the printable plan."
        inputMode="text"
      />
      <div className="field-row">
        <Field label="Slurry SG" value={sg} onChange={onSGChange} invalid={isBadNumber(sg)} placeholder="1.45" />
        <Field
          label="Slurry weight"
          unit="kg"
          value={weight}
          onChange={onWeightChange}
          invalid={isBadNumber(weight)}
          placeholder="e.g. 11.5"
        />
      </div>
      <div className="tips">
        <Tip title="How to measure SG">
          Stir the glaze well. Put a container on the scale and tare it, pour in exactly 100 mL of glaze, and read the
          weight. Weight ÷ 100 is the SG, so 145 g means 1.45. The more accurately you measure the volume, the better: 1
          mL out makes a 1% error. A hydrometer reads the SG directly.
        </Tip>
        <Tip title="How to weigh the slurry">
          Pour the sample back first. Weigh the slurry without the bucket: tare the bucket before filling it, or
          subtract the weight of a matching empty one.
        </Tip>
      </div>
      {problem && <Note tone="error">{problem}</Note>}
    </Card>
  );
}

function Tip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="tip">
      <summary>{title}</summary>
      <p>{children}</p>
    </details>
  );
}
