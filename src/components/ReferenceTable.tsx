import { useMemo, useState } from "react";
import { CATEGORY_NAMES, MATERIALS, searchMaterials, type Material } from "../lib/materials";
import { Card, ConfidenceBadge, fmt } from "./ui";

const USE_LABEL: Record<Material["use"], string> = {
  ok: "OK",
  caution: "Caution",
  invalid: "Dissolves",
  "n/a": "n/a",
};

export function ReferenceTable() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => searchMaterials(query), [query]);

  return (
    <div className="reference">
      <Card
        title="Material SG reference"
        aside={<span className="muted small head-meta">{MATERIALS.length} materials</span>}
        collapsible
      >
        <input
          className="search"
          type="search"
          placeholder="Search: zircon, ZnO, frit…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search materials"
        />
        <p className="legend">
          <strong>Data quality</strong> is how reliable the SG figure is, not how high it is. <em>High</em>: a pure
          compound or mineral with a well-established value. <em>Medium</em>: a natural or commercial material that
          varies by source. <em>Low</em>: an estimate, because no published value exists.
        </p>
        <div className="table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Formula</th>
                <th className="num">SG</th>
                <th className="num">Range</th>
                <th>Data quality</th>
                <th>In slurry</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className={m.parent ? "variant" : undefined}>{m.name}</span>
                    <span className="cat">{CATEGORY_NAMES[m.category]}</span>
                  </td>
                  <td className="formula">{m.formula ?? "–"}</td>
                  <td className="num strong">{fmt(m.sg, 2)}</td>
                  <td className="num muted">{m.high - m.low > 0.001 ? `${fmt(m.low, 2)}–${fmt(m.high, 2)}` : "–"}</td>
                  <td>
                    <ConfidenceBadge level={m.confidence} />
                  </td>
                  <td>
                    <span className={`use use-${m.use.replace("/", "")}`}>{USE_LABEL[m.use]}</span>
                  </td>
                  <td className="notes">{[m.basis, m.notes].filter(Boolean).join(" ")}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No material matches “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
