# Brongniart

A calculator for glaze slurries built on Brongniart's formula:

```
dry g per litre = (slurry g/L − 1000) × SG / (SG − 1)
```

Weigh a known volume of glaze to find out how much dry material and water it
holds, then how much water or powder brings it to a target SG.

## Features

- **Slurry input:** the slurry SG (with a note on measuring it by weighing 100 mL)
  and the slurry weight, without the bucket.
- **Two modes:**
  - *Simplified:* enter only the slurry SG. The powder SG is fixed at 2.5,
    the conventional average for glazes, and the result shows how much it
    would change for anything from 2.4 to 2.7.
  - *Advanced:* the powder SG is calculated from your ingredients
    (picked by type-to-search) as the mass-weighted harmonic mean of their
    SGs. It shows a low–high range and warns about soluble materials and
    estimated values.
- **Results:** powder and water in grams per kilo of slurry, side by side,
  what the whole batch holds, and water per 100 g of powder. A small line
  gives the same per litre.
- **Adjust to a target SG:** enter the target. Every answer ends with a
  scale reading to aim for.
  - *Too thick:* how much water to add.
  - *Too thin:* how much glaze powder to add (broken down by ingredient in
    recipe mode), or how much water to pour off or evaporate.
- **Glazy import:** paste a glazy.org recipe link in the bar at the top. It
  fills in the recipe and the glaze name, and switches to Advanced mode. Glazy names are matched to our materials (brand names like EPK or
  Custer included); anything unmatched is flagged for you to pick. The recipe
  is credited to its author, on screen and on the printed plan.
- **Printable plan:** a one-page A4 version of the adjustment for the studio,
  with the glaze name, the numbers, step-by-step instructions (both options
  when thickening) and an ingredient checklist. It uses the browser's print
  dialog, which also offers "Save as PDF".
- **Bucket label:** "Print label" in the results prints an A7 card (105 × 74 mm,
  a standard laminating pouch) on A4 with a cut line: name, recipe, the dated
  measurement and what the bucket holds. Imported recipes get a QR code to
  their Glazy page.
- **Clear all:** empties every input (after an "are you sure?" step). Inputs
  are otherwise kept in the browser across reloads.
- **Reference table:** every material in `data/materials-sg.json`, searchable.
  See [data/README.md](data/README.md) for sources and confidence levels.

## Development

```sh
npm install
npm run dev      # http://localhost:5174
npm test         # formula unit tests
npm run build    # typecheck + production build to dist/
```

### Glazy relay

Glazy's API (`https://api.glazy.org/api/recipes/<id>`) sends no CORS headers,
so the app calls `/glazy-api/...` on its own origin. `npm run dev` and
`npm run preview` relay that to Glazy (see `vite.config.ts`). Wherever the app
is hosted, add the same rewrite: `/glazy-api/*` → `https://api.glazy.org/*`.

The formula maths is in `src/lib/brongniart.ts`. The UI in `src/` reads the
JSON data directly, so edits to the data show up in the app without code
changes.
