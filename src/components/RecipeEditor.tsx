import { useState } from "react";
import { MATERIAL_BY_ID } from "../lib/materials";
import { newRow, type RecipeRow } from "../lib/recipe";
import { parseNumber } from "../lib/brongniart";
import { MaterialPicker } from "./MaterialPicker";
import { fmt } from "./ui";

export function RecipeEditor({ rows, onChange }: { rows: RecipeRow[]; onChange: (rows: RecipeRow[]) => void }) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const total = rows.reduce((sum, r) => {
    const n = parseNumber(r.amount);
    return sum + (n > 0 ? n : 0);
  }, 0);

  const update = (id: string, patch: Partial<RecipeRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="recipe">
      <div className="recipe-scroll">
        <table className="recipe-table">
          <thead>
            <tr>
              <th>Material</th>
              <th className="num">Amount</th>
              <th className="num">%</th>
              <th className="num">SG</th>
              <th aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const m = MATERIAL_BY_ID.get(row.materialId);
              const n = parseNumber(row.amount);
              return (
                <tr key={row.id} className={m?.use === "invalid" ? "row-excluded" : undefined}>
                  <td>
                    <MaterialPicker
                      value={row.materialId}
                      onChange={(materialId) => update(row.id, { materialId })}
                      autoFocus={row.id === focusId}
                    />
                  </td>
                  <td className="num">
                    <input
                      className="amount"
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) => update(row.id, { amount: e.target.value })}
                      aria-label="Amount"
                    />
                  </td>
                  <td className="num muted">{n > 0 && total > 0 ? fmt((n / total) * 100, 1) : "–"}</td>
                  <td className="num">{m ? fmt(m.sg, 2) : "–"}</td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                      aria-label="Remove row"
                      title="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="recipe-foot">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const row = newRow();
            setFocusId(row.id);
            onChange([...rows, row]);
          }}
        >
          + Add material
        </button>
        <span className="muted">Amounts in any unit; they're normalised to 100%. Additions count too.</span>
      </div>
    </div>
  );
}
