import { describe, expect, it } from "vitest";
import { GlazyError, fetchGlazyRecipe, matchGlazyMaterial, parseGlazyId, toRecipeRows } from "./glazy";

describe("parseGlazyId", () => {
  it("reads links with or without slug, scheme or www, and bare ids", () => {
    expect(parseGlazyId("https://glazy.org/recipes/832117/05c2-1-mate-dolomita")).toBe(832117);
    expect(parseGlazyId("glazy.org/recipes/832117")).toBe(832117);
    expect(parseGlazyId("https://www.glazy.org/recipes/832117?tab=images")).toBe(832117);
    expect(parseGlazyId(" 832117 ")).toBe(832117);
  });

  it("rejects anything else", () => {
    expect(parseGlazyId("https://glazy.org/materials/15349")).toBeNull();
    expect(parseGlazyId("mate dolomita")).toBeNull();
    expect(parseGlazyId("")).toBeNull();
  });
});

describe("matchGlazyMaterial", () => {
  it.each([
    ["Nepheline Syenite", "nepheline_syenite"],
    ["Dolomite", "dolomite"],
    ["Ball Clay", "ball_clay"],
    ["OM-4 Ball Clay", "ball_clay"],
    ["Whiting", "whiting"],
    ["Copper Carbonate", "copper_carbonate"],
    ["Cobalt Oxide", "cobalt_oxide"],
    ["EPK", "kaolin"],
    ["Grolleg Kaolin", "kaolin"],
    ["Custer Feldspar", "feldspar_potash"],
    ["G-200 Feldspar", "feldspar_potash"],
    ["Minspar 200", "feldspar_soda"],
    ["Silica", "silica"],
    ["Flint 325", "silica"],
    ["Ferro Frit 3134", "frit_3134"],
    ["Frit 3124", "frit_3124"],
    ["Gerstley Borate", "gerstley_borate"],
    ["Zircopax", "zircon_silicate"],
    ["Zirconium Silicate", "zircon_silicate"],
    ["Magnesium Silicate", "talc"],
    ["Red Iron Oxide", "iron_oxide"],
    ["Black Iron Oxide", "iron_oxide_black"],
    ["Mason 6600 Best Black", "pigment"],
    ["Soda Ash", "soda_ash"],
    ["Bone Ash", "bone_ash"],
    ["Tin Oxide", "tin_oxide"],
    ["Titanium Dioxide", "titanium_dioxide"],
    ["Calcined Alumina", "alumina"],
    ["Alumina Hydrate", "aluminium_hydroxide"],
    ["Silicon Carbide", "silicon_carbide"],
  ])("%s → %s", (name, key) => {
    expect(matchGlazyMaterial(name)).toBe(key);
  });

  it("leaves unknown materials unmatched", () => {
    expect(matchGlazyMaterial("Kaiser Pumice Special")).toBeNull();
  });
});

const ok = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("fetchGlazyRecipe", () => {
  const data = {
    id: 832117,
    name: "05C2-1 Mate Dolomita",
    createdByUser: { name: "José Garcia" },
    materialComponents: [
      { percentageAmount: "50.0000", isAdditional: false, material: { name: "Nepheline Syenite" } },
      { percentageAmount: "0.6000", isAdditional: true, material: { name: "Cobalt Oxide" } },
      { percentageAmount: "0", isAdditional: false, material: { name: "Nothing" } },
    ],
  };

  it("returns the recipe with its source and ingredients", async () => {
    const r = await fetchGlazyRecipe(832117, ok({ data }));
    expect(r).toMatchObject({ name: "05C2-1 Mate Dolomita", author: "José Garcia", url: "https://glazy.org/recipes/832117" });
    expect(r.ingredients).toEqual([
      { name: "Nepheline Syenite", amount: 50, isAddition: false },
      { name: "Cobalt Oxide", amount: 0.6, isAddition: true },
    ]);
    const rows = toRecipeRows(r);
    expect(rows.map((x) => [x.materialId, x.amount, x.sourceName])).toEqual([
      ["nepheline_syenite", "50", "Nepheline Syenite"],
      ["cobalt_oxide", "0.6", "Cobalt Oxide"],
    ]);
  });

  it("turns Glazy's in-body 404 into a readable error", async () => {
    const err = fetchGlazyRecipe(1, ok({ error: { message: "Recipe does not exist", status_code: 404 } }));
    await expect(err).rejects.toThrow("doesn't exist, or it's private");
  });

  it("reports rate limiting and network failures", async () => {
    await expect(fetchGlazyRecipe(1, ok({}, 429))).rejects.toThrow("busy");
    const offline = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    await expect(fetchGlazyRecipe(1, offline)).rejects.toBeInstanceOf(GlazyError);
  });
});
