import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CATEGORY_NAMES, MATERIAL_BY_ID, searchMaterials } from "../lib/materials";
import { fmt } from "./ui";

const MAX_RESULTS = 40;

/**
 * Type-to-search material picker. The input shows the chosen material's
 * name; typing filters, and Enter / click picks. Leaving without picking
 * puts the previous choice back.
 */
export function MaterialPicker({
  value,
  onChange,
  autoFocus,
  hint,
  note,
}: {
  value: string;
  onChange: (materialId: string) => void;
  autoFocus?: boolean;
  /** Where the ingredient came from (e.g. its Glazy name), shown while nothing is chosen. */
  hint?: string;
  /** A short tag inside the box, e.g. the Glazy name a material was matched from. */
  note?: string;
}) {
  const selected = MATERIAL_BY_ID.get(value);
  const idlePlaceholder = hint ? `${hint}: choose a match` : "Search materials…";
  const [query, setQuery] = useState<string | null>(null); // null = not editing
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const open = query !== null;
  const results = useMemo(() => (open ? searchMaterials(query).slice(0, MAX_RESULTS) : []), [open, query]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (id: string) => {
    onChange(id);
    setQuery(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setQuery("");
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (results[active]) pick(results[active].id);
    } else if (e.key === "Escape") {
      setQuery(null);
    }
  };

  return (
    <div className="picker">
      <div className="picker-box">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          aria-label="Material"
          title={selected?.name}
          placeholder={idlePlaceholder}
          value={open ? query : (selected?.name ?? "")}
          onFocus={(e) => {
            setQuery("");
            setActive(0);
            // Show the current name as a hint rather than text to delete.
            e.currentTarget.placeholder = selected?.name ?? idlePlaceholder;
          }}
          onBlur={(e) => {
            setQuery(null);
            e.currentTarget.placeholder = idlePlaceholder;
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        {note && !open && (
          <span className="picker-note" title={note}>
            {note}
          </span>
        )}
      </div>
      {open && (
        <ul className="picker-list" id={listId} role="listbox" ref={listRef}>
          {results.length === 0 && <li className="picker-empty">No match for “{query}”</li>}
          {results.map((m, i) => (
            <li
              key={m.id}
              id={`${listId}-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === active}
              className={`picker-option${i === active ? " active" : ""}${m.id === value ? " current" : ""}`}
              // mousedown, not click: it fires before the input's blur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m.id);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="picker-name">
                {m.parent && <span className="muted">↳ </span>}
                {m.name}
                {m.formula && <span className="picker-formula"> {m.formula}</span>}
              </span>
              <span className="picker-meta">
                {CATEGORY_NAMES[m.category]} · {fmt(m.sg, 2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
