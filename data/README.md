Data directory: recipe file format and tools

This folder contains per-country JSON files with recipe collections used by the app.

Structure

- Each file is an object with the following top-level properties:
  - `country` (string): country name
  - `flag` (string): emoji flag for display
  - `recipes` (array): list of recipe objects

Recipe object (summary)

- `id` (string) - unique id (e.g. `brazil-001`)
- `name` (string)
- `description` (optional string)
- `cuisine` (string)
- `mealType` (array) - allowed values: `breakfast`, `lunch`, `dinner`
- `image` (string) - URL
- `prepTime`, `cookTime` (number) - minutes
- `servings` (number)
- `difficulty` (string) - `easy` | `medium` | `hard`
- `ingredients` (array) - objects with `name`, `amount`, `category` (`protein`, `vegetable`, `grain`, `dairy`, `spice`, `other`, `nut`)
- `instructions` (array of strings)
- `nutrition` (object) - numbers for: `calories`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`
- `tags` (array of strings)
- `rating` (number 0-5), `reviews` (number)

Validation & formatting

- A JSON Schema for files is available at `data/recipe.schema.json`.
- Use the included scripts from the project root:

  - `npm run format-data` — normalizes recipe files (canonical key order, trims strings, fills missing numeric fields with 0/1 where appropriate).
  - `npm run validate-data` — runs a conservative validator that checks required fields, types, allowed enums, and reports unexpected properties.

Best practices

- Keep `id` values unique per file and globally unique across data files.
- Keep images as stable URLs or migrate assets to `assets/images/` and reference local paths.
- When adding many recipes (large batches), run `npm run format-data` then `npm run validate-data` before committing.

If you want CI integration, add a job that runs `npm run format-data && npm run validate-data` and fails on validation errors.
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
