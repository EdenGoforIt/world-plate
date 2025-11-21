const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ALLOWED_ING_CATS = ['protein', 'vegetable', 'grain', 'dairy', 'spice', 'other', 'nut'];

function normalizeIngredient(ing) {
	return {
		name: String(ing.name || '').trim(),
		amount: String(ing.amount || '').trim(),
		category: ALLOWED_ING_CATS.includes(ing.category) ? ing.category : 'other'
	};
}

function normalizeRecipe(r) {
	const normalized = {};
	// Keep canonical key order for readability
	normalized.id = String(r.id || '').trim();
	normalized.name = String(r.name || '').trim();
	if (r.description) normalized.description = String(r.description).trim();
	normalized.cuisine = String(r.cuisine || '').trim();
	normalized.mealType = Array.isArray(r.mealType) ? r.mealType.map(String) : [];
	normalized.image = String(r.image || '').trim();
	normalized.prepTime = typeof r.prepTime === 'number' ? r.prepTime : 0;
	normalized.cookTime = typeof r.cookTime === 'number' ? r.cookTime : 0;
	normalized.servings = typeof r.servings === 'number' ? r.servings : 1;
	normalized.difficulty = ['easy', 'medium', 'hard'].includes(r.difficulty) ? r.difficulty : 'easy';
	normalized.ingredients = Array.isArray(r.ingredients) ? r.ingredients.map(normalizeIngredient) : [];
	normalized.instructions = Array.isArray(r.instructions) ? r.instructions.map(String) : [];
	normalized.nutrition = {
		calories: Number(r.nutrition && r.nutrition.calories) || 0,
		protein: Number(r.nutrition && r.nutrition.protein) || 0,
		carbs: Number(r.nutrition && r.nutrition.carbs) || 0,
		fat: Number(r.nutrition && r.nutrition.fat) || 0,
		fiber: Number(r.nutrition && r.nutrition.fiber) || 0,
		sugar: Number(r.nutrition && r.nutrition.sugar) || 0,
		sodium: Number(r.nutrition && r.nutrition.sodium) || 0
	};
	normalized.tags = Array.isArray(r.tags) ? r.tags.map(String) : [];
	normalized.rating = typeof r.rating === 'number' ? r.rating : 0;
	normalized.reviews = typeof r.reviews === 'number' ? r.reviews : 0;

	return normalized;
}

function formatFile(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	let data;
	try { data = JSON.parse(raw); } catch (e) { console.error(filePath, 'invalid JSON:', e.message); return false; }
	if (!Array.isArray(data.recipes)) { console.warn(filePath, 'no recipes array — skipping'); return false; }
	data.recipes = data.recipes.map(normalizeRecipe);
	// Write back prettified JSON
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
	return true;
}

function main() {
	const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
	files.forEach(f => {
		const p = path.join(DATA_DIR, f);
		formatFile(p);
		console.log('Formatted', f);
	});
}

if (require.main === module) main();
