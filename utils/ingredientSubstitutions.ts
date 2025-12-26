export const COMMON_ALLERGENS = [
  'milk',
  'egg',
  'peanut',
  'tree nut',
  'shellfish',
  'fish',
  'soy',
  'wheat',
  'gluten'
];

const SUBSTITUTIONS: Record<string, string[]> = {
  milk: ['almond milk', 'oat milk', 'soy milk', 'coconut milk'],
  egg: ['flax egg (1 tbsp ground flax + 3 tbsp water)', 'applesauce (1/4 cup per egg)'],
  peanut: ['sunflower seed butter', 'almond butter'],
  'tree nut': ['seed-based butters (sunflower)'],
  shellfish: ['extra mushrooms or smoked tofu'],
  fish: ['smoked tofu', 'jackfruit (for texture)'],
  soy: ['coconut aminos', 'tamari-free options'],
  wheat: ['gluten-free flour', 'rice flour', 'almond flour'],
  gluten: ['gluten-free flour', 'rice flour', 'almond flour']
};

export const findAllergensInIngredients = (ingredients: { name: string }[], allergensToCheck?: string[]) => {
  const check = (allergensToCheck && allergensToCheck.length > 0) ? allergensToCheck : COMMON_ALLERGENS;
  const lowerIngredients = ingredients.map(i => i.name.toLowerCase());
  const found: Set<string> = new Set();

  for (const allergen of check) {
    for (const ing of lowerIngredients) {
      if (ing.includes(allergen)) {
        found.add(allergen);
      }
    }
  }
  return Array.from(found);
};

export const getSubstitutionsForIngredient = (ingredientName: string) => {
  const name = ingredientName.toLowerCase();
  const subs: string[] = [];
  for (const key of Object.keys(SUBSTITUTIONS)) {
    if (name.includes(key)) {
      subs.push(...SUBSTITUTIONS[key]);
    }
  }
  return subs;
};
