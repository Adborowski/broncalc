# Material SG list

[`materials-sg.json`](materials-sg.json) lists the **true (particle) specific
gravity** of dry glaze materials. This is the SG that Brongniart's formula uses:

```
dry g per litre of slurry = (g per litre of slurry − 1000) × SG / (SG − 1)
```

It is the density of the powder grains themselves, as a pycnometer measures it.
It is **not** the bulk density of the bag, and it is **not** the SG of a slurry
(the 1.4-something a hydrometer reads).

## Where the keys come from

The master list is the 70 canonical keys in
`../ceramic-materials/ceramics/taxonomy.py`. Every one of them is covered. This
project is not tied to Polish suppliers, so the list was generalised:

- **Added** materials that matter anywhere, or that move a mix SG a lot:
  colemanite, Ferro 3124 and 3195, lead bisilicate frit, magnesium oxide,
  zirconium oxide, cerium oxide.
- **Variants** where two grades sold under one name differ in density:
  calcined kaolin, fused silica, β-spodumene, red/black/yellow iron oxide,
  red copper oxide, Mn₃O₄.
- **Stains** are grouped by crystal host (`stain_families`) instead of by
  brand code, because density follows the host crystal, not the colour or the
  maker.
- **Studio products** (wax, latex, plaster, etc.) are kept so every key
  resolves, marked `brongniart: "n/a"`.

## How good the numbers are

| confidence | count | what it means |
|---|---|---|
| high | 40 | Pure compound or mineral with a tight published range (quartz, calcite, ZnO, SnO₂…). |
| medium | 15 | Natural or commercial material whose composition varies (ball clay, talc, basic carbonates, MnO₂ ore…). |
| low | 14 | Estimate. No published figure exists: frits, stains, Gerstley borate, wood ash, lava. |

Sources:

- **Minerals and compounds:** standard reference densities (mineralogical
  data and the chemical handbooks). A spot-check against Wikipedia's mineral
  and compound tables matched: cobalt carbonate 4.13, hydromagnesite
  2.16–2.2, wollastonite 2.86–3.09, petalite 2.4, α-spodumene 3.03–3.23.
- **Frits:** Ferro's own safety data sheets for 3110, 3134 and 3195 give
  *relative density: no data available*. Mason's sheet for 6433/6450 says
  *N/A*. Digitalfire's frit pages give no figure. The frit values are
  estimated from each oxide composition by comparison with glasses of known
  density, and are marked `low`.
- **Gerstley borate:** no published SG. The value is estimated from its
  constituent minerals.

## Does precision matter?

A ±0.1 error in the SG of the mix changes the dry weight by about 3%. Most
glaze bases fall between 2.55 and 2.7, so even a `low` value on a frit that is
20% of a recipe moves the result by less than 1%. The materials worth getting
right are the heavy ones in large amounts: zircon, tin, zinc, barium, lead
frits.

## Mix SG

The mix SG is a mass-weighted **harmonic** mean. Averaging the SG values
directly is wrong.

```
1 / SG_mix = Σ (mass fraction_i / SG_i)
```

Leave out materials with `brongniart: "invalid"` or `"n/a"`, and renormalise
the remaining fractions to 100%.

## Soluble materials

Brongniart's formula assumes every gram of solid stays a suspended particle.
Anything that dissolves adds weight to the liquid instead, so the result comes
out low.

- `invalid`: soda ash, pearl ash, borax, boric acid, Epsom salt, gums. The
  formula does not apply to these. At deflocculant or flocculant doses they
  can be ignored.
- `caution`: lithium carbonate, Gerstley borate, ulexite, alkaline frits,
  unwashed wood ash. A small part dissolves, and readings can drift as the
  slurry ages.

## Measuring your own glaze's SG

For a glaze you mix often, measuring beats any table. It also works for
frits, stains and ash. Rearranging Brongniart's formula:

1. Weigh out a known dry mass **D** of the glaze powder, e.g. 500 g.
2. Mix it into water and top up to a known total volume **V** in a
   volumetric flask or graduated cylinder, e.g. 1000 mL. Remove air: let it
   stand, and tap or stir gently.
3. Weigh the slurry: **M** g.
4. Calculate:

   ```
   SG = D / (D − (M − V))
   ```

The result is sensitive to how accurate the volume is: 1 mL out of 1000 shifts
the SG by roughly 0.01. Use a real volumetric flask and do it at room
temperature.
