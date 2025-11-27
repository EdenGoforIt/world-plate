const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const ALLOWED_MEALTYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side', 'soup', 'drink'];
const ALLOWED_DIFFICULTY = ['easy', 'medium', 'hard'];
const ALLOWED_ING_CATS = ['protein', 'vegetable', 'grain', 'dairy', 'spice', 'other', 'nut'];
const ALLOWED_RECIPE_KEYS = [
	'id', 'name', 'description', 'cuisine', 'mealType', 'image',
	'prepTime', 'cookTime', 'servings', 'difficulty', 'ingredients',
	'instructions', 'nutrition', 'tags', 'rating', 'reviews'
];
const ALLOWED_ING_KEYS = ['name', 'amount', 'category'];

const errorLog = [];
function error(file, recipeId, msg) {
	const line = `${file}${recipeId ? ':' + recipeId : ''} -> ${msg}`;
	console.error(line);
	errorLog.push({ file, recipeId: recipeId || null, message: msg });
}

function validateNutrition(nut, file, recipeId) {
	const keys = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
	let ok = true;
	if (typeof nut !== 'object' || nut === null) {
		error(file, recipeId, 'nutrition must be an object');
		return false;
	}
	keys.forEach(k => {
		if (typeof nut[k] !== 'number' || Number.isNaN(nut[k])) {
			error(file, recipeId, `nutrition.${k} must be a number`);
			ok = false;
		}
	});
	return ok;
}

function validateIngredient(ing, file, recipeId) {
	if (typeof ing !== 'object' || ing === null) {
		error(file, recipeId, 'ingredient must be an object');
		return false;
	}
	if (!ing.name || !ing.amount) {
		error(file, recipeId, 'ingredient missing name or amount');
		return false;
	}
	if (!ALLOWED_ING_CATS.includes(ing.category)) {
		error(file, recipeId, `ingredient.category must be one of: ${ALLOWED_ING_CATS.join(', ')}`);
		return false;
	}

	// detect unexpected properties on ingredient
	Object.keys(ing).forEach(k => {
		if (!ALLOWED_ING_KEYS.includes(k)) {
			error(file, recipeId, `ingredient has unexpected property '${k}'`);
		}
	});
	return true;
}

function validateRecipe(r, file) {
	const id = r.id || '<no-id>';
	let ok = true;
	const requiredStr = ['id', 'name', 'cuisine', 'image'];
	requiredStr.forEach(k => {
		if (!r[k] || (typeof r[k] !== 'string' && k !== 'image')) {
			error(file, id, `${k} is required and must be a string`);
			ok = false;
		}
	});

	if (!Array.isArray(r.mealType) || r.mealType.some(m => !ALLOWED_MEALTYPES.includes(m))) {
		error(file, id, `mealType must be array containing any of: ${ALLOWED_MEALTYPES.join(',')}`);
		ok = false;
	}

	// detect unexpected top-level recipe properties
	Object.keys(r).forEach(k => {
		if (!ALLOWED_RECIPE_KEYS.includes(k)) {
			error(file, id, `unexpected property on recipe: '${k}'`);
			ok = false;
		}
	});

	if (typeof r.prepTime !== 'number' || r.prepTime < 0) { error(file, id, 'prepTime must be non-negative number'); ok = false; }
	if (typeof r.cookTime !== 'number' || r.cookTime < 0) { error(file, id, 'cookTime must be non-negative number'); ok = false; }
	if (typeof r.servings !== 'number' || r.servings <= 0) { error(file, id, 'servings must be positive number'); ok = false; }
	if (!ALLOWED_DIFFICULTY.includes(r.difficulty)) { error(file, id, `difficulty must be one of: ${ALLOWED_DIFFICULTY.join(',')}`); ok = false; }

	if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) { error(file, id, 'ingredients must be a non-empty array'); ok = false; }
	else {
		r.ingredients.forEach(ing => { if (!validateIngredient(ing, file, id)) ok = false; });
	}

	if (!Array.isArray(r.instructions) || r.instructions.some(s => typeof s !== 'string')) { error(file, id, 'instructions must be array of strings'); ok = false; }

	if (!validateNutrition(r.nutrition, file, id)) ok = false;

	if (!Array.isArray(r.tags)) { error(file, id, 'tags must be array'); ok = false; }
	if (typeof r.rating !== 'number') { error(file, id, 'rating must be number'); ok = false; }
	if (typeof r.reviews !== 'number') { error(file, id, 'reviews must be number'); ok = false; }

	return ok;
}

function validateFile(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	let data;
	try { data = JSON.parse(raw); } catch (e) { console.error(filePath, 'invalid JSON:', e.message); return false; }
	const file = path.basename(filePath);
	if (typeof data.country !== 'string') { error(file, null, 'country (string) is required'); return false; }
	if (typeof data.flag !== 'string') { error(file, null, 'flag (string) is required'); return false; }
	if (!Array.isArray(data.recipes)) { error(file, null, 'recipes (array) is required'); return false; }

	let ok = true;
	const ids = new Set();
	data.recipes.forEach(r => {
		if (!r.id) { error(file, null, 'recipe missing id'); ok = false; }
		else if (ids.has(r.id)) { error(file, r.id, 'duplicate recipe id in file'); ok = false; }
		else ids.add(r.id);
		if (!validateRecipe(r, file)) ok = false;
	});

	return ok;
}

function main() {
	const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'recipe.schema.json');
	let overallOk = true;
	files.forEach(f => {
		const p = path.join(DATA_DIR, f);
		const ok = validateFile(p);
		if (!ok) overallOk = false;
	});
	const reportPath = path.join(DATA_DIR, 'validation-report.json');
	fs.writeFileSync(reportPath, JSON.stringify({ overallOk, errors: errorLog }, null, 2), 'utf8');
	if (!overallOk) {
		console.error('\nValidation failed. See errors above.');
		console.error(`Wrote detailed report to ${reportPath}`);
		process.exit(2);
	} else {
		console.log('All data files passed basic validation.');
		console.log(`Wrote detailed report to ${reportPath}`);
		process.exit(0);
	}
}

if (require.main === module) main();
