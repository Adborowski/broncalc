import type { ReactNode } from "react";
import { parseNumber } from "../lib/brongniart";
import type { Confidence } from "../lib/materials";

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 850 → "850 g", 2140 → "2.14 kg". */
export function fmtMass(grams: number): string {
  return Math.abs(grams) >= 1000 ? `${fmt(grams / 1000, 2)} kg` : `${fmt(grams, grams < 10 ? 1 : 0)} g`;
}

/** 0.4 → "40%", 0.125 → "12.5%". */
export function fmtPercent(fraction: number): string {
  return `${(fraction * 100).toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
}

/** 93 → "93 mL", 1250 → "1.25 L". */
export function fmtVolume(ml: number): string {
  return ml >= 1000 ? `${fmt(ml / 1000, 2)} L` : `${fmt(ml)} mL`;
}

/** ["a"] → "a", ["a", "b", "c"] → "a, b and c". */
export function listJoin(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Warning for pouring off water, worded to read right for one material or several. */
export function pourOffWarning(soluble: string[]): string {
  return `Part of the recipe dissolves in water (${listJoin(soluble)}). Pouring off water loses a little of it; evaporating keeps it all.`;
}

export function Card({
  title,
  step,
  children,
  aside,
  collapsible = false,
}: {
  title: string;
  step?: string;
  children: ReactNode;
  aside?: ReactNode;
  /** Starts closed; the header opens it. */
  collapsible?: boolean;
}) {
  const heading = (
    <h2>
      {step && <span className="step">{step}</span>}
      {title}
    </h2>
  );
  if (collapsible) {
    return (
      <details className="card card-collapsible">
        <summary className="card-head">
          {heading}
          {aside}
          <span className="chevron" aria-hidden="true" />
        </summary>
        <div className="card-body">{children}</div>
      </details>
    );
  }
  return (
    <section className="card">
      <header className="card-head">
        {heading}
        {aside}
      </header>
      {children}
    </section>
  );
}

/** True when something is typed but it isn't a number above `min` (so an empty field isn't flagged). */
export function isBadNumber(text: string, min = 0): boolean {
  return text.trim() !== "" && !(parseNumber(text) > min);
}

export function Field({
  label,
  value,
  onChange,
  unit,
  hint,
  invalid,
  placeholder,
  inputMode = "decimal",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  hint?: ReactNode;
  invalid?: boolean;
  placeholder?: string;
  inputMode?: "decimal" | "text";
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={`input-wrap${invalid ? " invalid" : ""}`}>
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="unit">{unit}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

/** A print button with a line of explanation beside it. */
export function PrintRow({ label, onPrint, children }: { label: string; onPrint: () => void; children: ReactNode }) {
  return (
    <div className="print-row">
      <button type="button" className="btn-primary" onClick={onPrint}>
        {label}
      </button>
      <span className="muted small">{children}</span>
    </div>
  );
}

/** A two-or-more-way toggle, e.g. the mode switch. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className = "",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={`seg ${className}`} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return <span className={`badge conf-${level}`}>{level}</span>;
}

export function Note({ tone = "info", children }: { tone?: "info" | "warn" | "error"; children: ReactNode }) {
  return <div className={`note note-${tone}`}>{children}</div>;
}
