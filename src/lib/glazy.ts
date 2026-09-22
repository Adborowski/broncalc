/**
 * Import a recipe from Glazy (glazy.org), the open ceramics recipe library.
 *
 * Glazy's recipe data comes from its public, undocumented JSON API. The API
 * doesn't send CORS headers, so the browser can't call it directly: requests
 * go to /glazy-api on our own origin, which the server relays to
 * https://api.glazy.org (see vite.config.ts for dev and preview).
 *
 * Glazy content is CC BY-NC-SA 4.0. We only use ingredient names and amounts,
 * and always show where a recipe came from.
 */
import { MATERIAL_BY_ID } from "./materials";
import { newRow, type RecipeRow } from "./recipe";

/** Glazy's own page on how to support it (Patreon, PayPal). */
export const GLAZY_SUPPORT_URL = "https://help.glazy.org/support";

export interface GlazySource {
  id: number;
  name: string;
  author: string | null;
  url: string;
}

export interface GlazyIngredient {
  name: string;
  amount: number;
  isAddition: boolean;
}

export interface GlazyRecipe extends GlazySource {
  ingredients: GlazyIngredient[];
}

/** Pulls the recipe id out of a Glazy link, or accepts a bare id. */
export function parseGlazyId(text: string): number | null {
  const t = text.trim();
  const fromUrl = t.match(/glazy\.org\/recipes\/(\d+)/i);
  if (fromUrl) return Number(fromUrl[1]);
  return /^\d+$/.test(t) ? Number(t) : null;
}

export class GlazyError extends Error {}

interface ApiRecipe {
  id: number;
  name: string;
  createdByUser?: { name?: string } | null;
  materialComponents?: {
    percentageAmount: string;
    isAdditional: boolean;
    material?: { name?: string } | null;
  }[];
}

export async function fetchGlazyRecipe(id: number, fetchImpl: typeof fetch = fetch): Promise<GlazyRecipe> {
  let body: { data?: ApiRecipe; error?: { message?: string; status_code?: number } };
  try {
    const res = await fetchImpl(`/glazy-api/api/recipes/${id}`, { headers: { Accept: "application/json" } });
    if (res.status === 429) throw new GlazyError("Glazy is busy right now. Try again in a minute.");
    body = await res.json();
  } catch (e) {
    if (e instanceof GlazyError) throw e;
    throw new GlazyError("Couldn't reach Glazy. Check your connection and try again.");
  }
  // Glazy reports errors in the body, with HTTP 200.
  if (body.error || !body.data) {
    throw new GlazyError(
      body.error?.status_code === 404
        ? "That recipe doesn't exist, or it's private."
        : "Glazy couldn't return that recipe.",
    );
  }
  const r = body.data;
  const ingredients = (r.materialComponents ?? [])
    .map((c) => ({
      name: c.material?.name?.trim() ?? "",
      amount: Number(c.percentageAmount),
      isAddition: c.isAdditional,
    }))
    .filter((c) => c.name && c.amount > 0);
  if (ingredients.length === 0) throw new GlazyError("That recipe has no ingredients to import.");
  return {
    id: r.id,
    name: r.name,
    author: r.createdByUser?.name ?? null,
    url: `https://glazy.org/recipes/${r.id}`,
    ingredients,
  };
}

/**
 * Glazy material names → our material keys. Tried in order; the first
 * pattern that matches the lower-cased name wins. Covers generic names and
 * the brand names that dominate Glazy (mostly North American).
 */
const RULES: [RegExp, string][] = [
  // Frits: match the number, whatever the maker's prefix.
  [/\b3134\b/, "frit_3134"],
  [/\b3124\b/, "frit_3124"],
  [/\b3195\b/, "frit_3195"],
  [/\b3110\b/, "frit_3110"],
  [/lead bisilicate/, "frit_lead_bisilicate"],
  [/\bfrit\b/, "frit"],
  // Stains before colourants, so "Mason 6600 Best Black" isn't read as an oxide.
  [/\bmason\b|\bstain\b|\bcerdec\b|\bspectrum\b/, "pigment"],
  // Clays.
  [/calcined kaolin|metakaolin|glomax/, "kaolin_calcined"],
  [/\bepk\b|kaolin|china clay|grolleg|tile ?#?6|\bkaopaque|\bhelmer|\bnewman red/, "kaolin"],
  [/ball clay|\bom-?4\b|\bom ?#?4\b|\bkentucky\b|\bhywite\b|\bold hickory\b/, "ball_clay"],
  [/bentonite|macaloid|veegum/, "bentonite"],
  [/fire ?clay|\bhawthorn\b|\bgoldart\b|\blincoln\b/, "fire_clay"],
  // Borates.
  [/gerstley|gillespie|laguna borate/, "gerstley_borate"],
  [/colemanite/, "colemanite"],
  [/ulexite/, "ulexite"],
  [/boric acid/, "boric_acid"],
  [/borax/, "borax"],
  // Feldspars and friends.
  [/nepheline/, "nepheline_syenite"],
  [/\bcuster\b|\bg-?200\b|potash feldspar|orthoclase|\bk-?200\b|\bmahavir\b|\bfhm\b|\bk-?spar\b/, "feldspar_potash"],
  [/\bminspar\b|\bkona\b|soda feldspar|albite|\bnc-?4\b|\bf-?4\b|\bsoda spar\b/, "feldspar_soda"],
  [/cornwall stone|cornish stone/, "feldspar_potash"],
  [/lime feldspar|anorthite|plagioclase/, "feldspar_lime"],
  [/\bfeldspar\b/, "feldspar_potash"],
  [/spodumene/, "spodumene"],
  [/petalite/, "petalite"],
  [/lithium carbonate/, "lithium_carbonate"],
  [/cryolite/, "cryolite"],
  [/fluorspar|fluorite/, "fluorspar"],
  [/soda ash|sodium carbonate/, "soda_ash"],
  [/pearl ash|potassium carbonate/, "potassium_carbonate"],
  // Silicates, before silica, which their names contain.
  [/zircopax|superpax|ultrox|zircon|zirconium silicate/, "zircon_silicate"],
  [/\btalc\b|magnesium silicate/, "talc"],
  [/wollastonite|calcium silicate/, "wollastonite"],
  // Silica.
  [/fused silica/, "silica_fused"],
  [/silica|\bflint\b|quartz/, "silica"],
  // Alkaline earths.
  [/dolomite/, "dolomite"],
  [/whiting|calcium carbonate|\bcalcite\b|\bchalk\b/, "whiting"],
  [/magnesium carbonate|magnesite/, "magnesium_carbonate"],
  [/magnesium oxide|magnesia/, "magnesium_oxide"],
  [/strontium carbonate/, "strontium_carbonate"],
  [/barium carbonate/, "barium_carbonate"],
  [/zinc oxide|\bzinc\b/, "zinc_oxide"],
  [/bone ash|tricalcium phosphate|calcium phosphate/, "bone_ash"],
  [/wood ash|\bash\b/, "wood_ash"],
  [/basalt/, "basalt_meal"],
  // Opacifiers.
  [/zirconium oxide|zirconia/, "zirconium_oxide"],
  [/tin oxide|stannic/, "tin_oxide"],
  [/titanium dioxide|titanium oxide|\btio2\b/, "titanium_dioxide"],
  [/cerium/, "cerium_oxide"],
  // Colourants.
  [/rutile/, "rutile"],
  [/ilmenite/, "ilmenite"],
  [/black iron oxide|magnetite/, "iron_oxide_black"],
  [/yellow iron oxide|yellow ochre|\bochre\b/, "iron_oxide_yellow"],
  [/iron chromate/, "iron_chromate"],
  [/red iron oxide|iron oxide|hematite|\brio\b|crocus martis/, "iron_oxide"],
  [/cobalt carbonate/, "cobalt_carbonate"],
  [/cobalt oxide|cobalt/, "cobalt_oxide"],
  [/copper carbonate/, "copper_carbonate"],
  [/red copper oxide|cuprous/, "copper_oxide_red"],
  [/copper oxide|cupric|copper/, "copper_oxide"],
  [/chrom/, "chrome_oxide"],
  [/manganese/, "manganese_dioxide"],
  [/nickel/, "nickel_oxide"],
  [/vanadium/, "vanadium"],
  // Refractories.
  [/alumina hydrate|aluminum hydroxide|aluminium hydroxide|hydrated alumina/, "aluminium_hydroxide"],
  [/alumina|aluminum oxide|aluminium oxide/, "alumina"],
  [/silicon carbide/, "silicon_carbide"],
];

/** Our material key for a Glazy material name, or null if nothing fits. */
export function matchGlazyMaterial(glazyName: string): string | null {
  const name = glazyName.toLowerCase();
  for (const [pattern, key] of RULES) {
    if (pattern.test(name) && MATERIAL_BY_ID.has(key)) return key;
  }
  return null;
}

/** Recipe rows for the editor. Unmatched rows keep Glazy's name so the user can pick. */
export function toRecipeRows(recipe: GlazyRecipe): RecipeRow[] {
  return recipe.ingredients.map((ing) => ({
    ...newRow(matchGlazyMaterial(ing.name) ?? "", String(ing.amount)),
    sourceName: ing.name,
  }));
}
