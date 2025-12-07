import { Recipe } from "../types/Recipe";

export interface PantryMatch {
  recipe: Recipe;
  matchedIngredients: string[];
  missingIngredients: string[];
  missingCount: number;
  matchPercent: number;
}

export function matchRecipesByPantry(
  recipes: Recipe[],
  pantryItems: string[],
  options?: { maxMissing?: number }
): PantryMatch[] {
  const pantry = pantryItems.map((p) => p.toLowerCase().trim()).filter(Boolean);

  const matches: PantryMatch[] = recipes.map((recipe) => {
    const recipeIngredientNames = recipe.ingredients.map((i) => i.name.toLowerCase());

    const matched: string[] = [];
    const missing: string[] = [];

    recipeIngredientNames.forEach((ing) => {
      const found = pantry.find((p) => ing.includes(p) || p.includes(ing));
      if (found) matched.push(ing);
      else missing.push(ing);
    });

    const missingCount = missing.length;
    const matchPercent = recipeIngredientNames.length === 0 ? 0 : Math.round((matched.length / recipeIngredientNames.length) * 100);

    return {
      recipe,
      matchedIngredients: matched,
      missingIngredients: missing,
      missingCount,
      matchPercent,
    };
  });

  let filtered = matches.sort((a, b) => {
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
    return b.matchPercent - a.matchPercent;
  });

  if (options && typeof options.maxMissing === "number") {
    filtered = filtered.filter((m) => m.missingCount <= (options.maxMissing || 0));
  }

  return filtered;
}

export function summarizePantryMatch(match: PantryMatch) {
  return `${match.recipe.name} — ${match.matchPercent}% match (${match.missingCount} missing)`;
}
