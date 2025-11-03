World Plate — data folder

This folder contains per-country JSON files with a small collection of recipes. Files follow this shape (see `recipe.schema.json` for machine-readable schema):

- Top-level object: { country: string, flag: string, recipes: Recipe[] }
- Each Recipe must include at minimum: id, name, cuisine, mealType, image, prepTime, cookTime, servings, difficulty, ingredients, instructions, nutrition, tags, rating, reviews

Conventions:

- Keep `id` unique within the country file and use a short prefix (e.g. `brazil-001`).
- `mealType` is an array of any of: `breakfast`, `lunch`, `dinner`.
- `ingredients` items must include: `name`, `amount`, `category` where `category` is one of `protein`, `vegetable`, `grain`, `dairy`, `spice`, `other`, `nut`.
- `nutrition` fields should be numeric (calories, protein, carbs, fat, fiber, sugar, sodium).

Tools added:

- `scripts/validate-recipes.js` — run to validate all `data/*.json` files against the conventions.
- `scripts/format-recipes.js` — normalizes and fills simple defaults (non-destructive where possible).

Workflow suggestions:

- Run `npm run validate-data` in CI to prevent invalid recipe files from being committed.
- Use `npm run format-data` locally to normalize files before committing.
