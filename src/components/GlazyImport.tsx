import { useState, type FormEvent } from "react";
import {
  GlazyError,
  fetchGlazyRecipe,
  matchGlazyMaterial,
  parseGlazyId,
  GLAZY_SUPPORT_URL,
  type GlazyRecipe,
  type GlazySource,
} from "../lib/glazy";
import { Note } from "./ui";

type Status =
  { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "done"; message: string };

/** "Imported X: 10 of 11 ingredients matched." */
function summary(recipe: GlazyRecipe): string {
  const total = recipe.ingredients.length;
  const matched = recipe.ingredients.filter((i) => matchGlazyMaterial(i.name)).length;
  const detail =
    matched === total
      ? `all ${total} ingredients matched`
      : `${matched} of ${total} ingredients matched. Pick the rest in step 2`;
  return `Imported ${recipe.name}: ${detail}.`;
}

/**
 * The optional "start from a Glazy recipe" bar at the top of the page. A
 * successful import fills the name and recipe; the page decides the rest.
 */
export function GlazyImportBar({ onImported }: { onImported: (recipe: GlazyRecipe) => void }) {
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const id = parseGlazyId(link);
    if (id == null) {
      setStatus({ kind: "error", message: "Paste a link to a recipe, like glazy.org/recipes/832117." });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const recipe = await fetchGlazyRecipe(id);
      onImported(recipe);
      setLink("");
      setStatus({ kind: "done", message: summary(recipe) });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof GlazyError ? err.message : "Something went wrong." });
    }
  }

  return (
    <section className="glazy-bar" aria-label="Import from Glazy">
      <form className="glazy-form" onSubmit={submit}>
        <label className="glazy-label" htmlFor="glazy-link">
          Have a Glazy recipe?
        </label>
        <input
          id="glazy-link"
          type="text"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste a glazy.org recipe link"
        />
        <button type="submit" className="btn-secondary" disabled={status.kind === "loading" || !link.trim()}>
          {status.kind === "loading" ? "Importing…" : "Import"}
        </button>
      </form>
      {status.kind === "error" && <Note tone="error">{status.message}</Note>}
      {status.kind === "done" && <p className="glazy-done">{status.message}</p>}
    </section>
  );
}

/**
 * Credit for an imported recipe: its author (required by the CC BY-NC-SA
 * licence), and Glazy itself, which is free and runs on its supporters.
 */
export function GlazyCredit({ source }: { source: GlazySource }) {
  return (
    <div className="glazy-credit">
      <p>
        From Glazy:{" "}
        <a href={source.url} target="_blank" rel="noreferrer">
          {source.name}
        </a>
        {source.author && <> by {source.author}</>}, shared under{" "}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">
          CC BY-NC-SA 4.0
        </a>
        .
      </p>
      <p>
        <a href="https://glazy.org" target="_blank" rel="noreferrer">
          Glazy
        </a>{" "}
        is a free, open recipe library kept running by its community.{" "}
        <a href={GLAZY_SUPPORT_URL} target="_blank" rel="noreferrer">
          Support Glazy
        </a>
        .
      </p>
    </div>
  );
}
