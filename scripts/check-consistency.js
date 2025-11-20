#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple consistency checker
function loadDataFiles() {
	const dataDir = path.join(__dirname, '../data');
	const files = fs.readdirSync(dataDir).filter(file =>
		file.endsWith('.json') && file !== 'index.json' && file !== 'recipe.schema.json'
	);

	const allRecipes = [];
	const fileRecipes = {};

	for (const file of files) {
		try {
			const filePath = path.join(dataDir, file);
			const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			if (data.recipes && Array.isArray(data.recipes)) {
				fileRecipes[file] = data.recipes;
				allRecipes.push(...data.recipes);
			}
		} catch (error) {
			console.error(`Error loading ${file}:`, error.message);
		}
	}

	return { allRecipes, fileRecipes };
}

function checkDataConsistency(recipes) {
	const issues = {
		duplicateIds: [],
		missingFields: [],
		inconsistentCuisines: [],
		suspiciousNutrition: [],
		ingredientIssues: [],
	};

	const seenIds = new Set();
	const cuisineVariations = {};
	const ingredientVariations = {};

	recipes.forEach((recipe, index) => {
		// Check for duplicate IDs
		if (seenIds.has(recipe.id)) {
			issues.duplicateIds.push(recipe.id);
		} else {
			seenIds.add(recipe.id);
		}

		// Check for missing required fields
		const required = ['id', 'name', 'cuisine', 'mealType', 'ingredients', 'instructions'];
		const missing = required.filter(field => !recipe[field]);
		if (missing.length > 0) {
			issues.missingFields.push({
				recipe: recipe.name || `Recipe ${index + 1}`,
				missing,
			});
		}

		// Track cuisine variations (for inconsistency detection)
		if (recipe.cuisine) {
			const normalized = recipe.cuisine.toLowerCase().trim();
			if (!cuisineVariations[normalized]) {
				cuisineVariations[normalized] = new Set();
			}
			cuisineVariations[normalized].add(recipe.cuisine);
		}

		// Check nutrition values
		if (recipe.nutrition) {
			const nutrition = recipe.nutrition;
			if (nutrition.calories > 2000 || nutrition.protein > 100 || nutrition.sodium > 3000) {
				issues.suspiciousNutrition.push({
					recipe: recipe.name,
					calories: nutrition.calories,
					protein: nutrition.protein,
					sodium: nutrition.sodium,
				});
			}
		}

		// Track ingredient name variations
		if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
			recipe.ingredients.forEach(ingredient => {
				if (ingredient.name) {
					const normalized = ingredient.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
					if (!ingredientVariations[normalized]) {
						ingredientVariations[normalized] = new Set();
					}
					ingredientVariations[normalized].add(ingredient.name);
				}
			});
		}
	});

	// Find cuisine inconsistencies
	Object.entries(cuisineVariations).forEach(([normalized, variations]) => {
		if (variations.size > 1) {
			issues.inconsistentCuisines.push({
				variations: Array.from(variations),
				suggested: getMostCommon(Array.from(variations)),
			});
		}
	});

	// Find ingredient inconsistencies
	Object.entries(ingredientVariations).forEach(([normalized, variations]) => {
		if (variations.size > 1) {
			issues.ingredientIssues.push({
				variations: Array.from(variations),
				suggested: getMostCommon(Array.from(variations)),
			});
		}
	});

	return issues;
}

function getMostCommon(items) {
	const counts = {};
	items.forEach(item => {
		counts[item] = (counts[item] || 0) + 1;
	});

	return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
}

function generateConsistencyReport(issues) {
	console.log('\n🔍 DATA CONSISTENCY CHECK');
	console.log('=========================\n');

	let totalIssues = 0;

	if (issues.duplicateIds.length > 0) {
		console.log('❌ Duplicate IDs found:');
		issues.duplicateIds.forEach(id => console.log(`   ${id}`));
		console.log('');
		totalIssues += issues.duplicateIds.length;
	}

	if (issues.missingFields.length > 0) {
		console.log('⚠️  Missing Required Fields:');
		issues.missingFields.slice(0, 10).forEach(item => {
			console.log(`   ${item.recipe}: missing ${item.missing.join(', ')}`);
		});
		if (issues.missingFields.length > 10) {
			console.log(`   ... and ${issues.missingFields.length - 10} more`);
		}
		console.log('');
		totalIssues += issues.missingFields.length;
	}

	if (issues.inconsistentCuisines.length > 0) {
		console.log('🌍 Inconsistent Cuisine Names:');
		issues.inconsistentCuisines.slice(0, 5).forEach(item => {
			console.log(`   Variations: ${item.variations.join(', ')}`);
			console.log(`   Suggested: ${item.suggested}`);
			console.log('');
		});
		totalIssues += issues.inconsistentCuisines.length;
	}

	if (issues.suspiciousNutrition.length > 0) {
		console.log('🔬 Suspicious Nutrition Values:');
		issues.suspiciousNutrition.slice(0, 5).forEach(item => {
			console.log(`   ${item.recipe}: ${item.calories} cal, ${item.protein}g protein, ${item.sodium}mg sodium`);
		});
		if (issues.suspiciousNutrition.length > 5) {
			console.log(`   ... and ${issues.suspiciousNutrition.length - 5} more`);
		}
		console.log('');
		totalIssues += issues.suspiciousNutrition.length;
	}

	if (issues.ingredientIssues.length > 0) {
		console.log('🥕 Inconsistent Ingredient Names:');
		issues.ingredientIssues.slice(0, 5).forEach(item => {
			console.log(`   Variations: ${item.variations.join(', ')}`);
			console.log(`   Suggested: ${item.suggested}`);
			console.log('');
		});
		if (issues.ingredientIssues.length > 5) {
			console.log(`   ... and ${issues.ingredientIssues.length - 5} more`);
		}
		totalIssues += issues.ingredientIssues.length;
	}

	if (totalIssues === 0) {
		console.log('✅ No consistency issues found!');
	} else {
		console.log(`📊 Total issues found: ${totalIssues}`);
		console.log('\n💡 Consider running the data normalization script to fix these issues.');
	}

	console.log('');
}

function main() {
	console.log('🔍 Checking data consistency...\n');

	try {
		const { allRecipes } = loadDataFiles();

		if (allRecipes.length === 0) {
			console.log('❌ No recipe data found!');
			process.exit(1);
		}

		console.log(`📊 Analyzing ${allRecipes.length} recipes...\n`);

		const issues = checkDataConsistency(allRecipes);
		generateConsistencyReport(issues);

	} catch (error) {
		console.error('❌ Consistency check failed:', error.message);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}