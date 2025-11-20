#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple TypeScript-like interface validation for Node.js
function loadDataFiles() {
	const dataDir = path.join(__dirname, '../data');
	const files = fs.readdirSync(dataDir).filter(file =>
		file.endsWith('.json') && file !== 'index.json' && file !== 'recipe.schema.json'
	);

	const allRecipes = [];

	for (const file of files) {
		try {
			const filePath = path.join(dataDir, file);
			const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			if (data.recipes && Array.isArray(data.recipes)) {
				allRecipes.push(...data.recipes);
			}
		} catch (error) {
			console.error(`Error loading ${file}:`, error.message);
		}
	}

	return allRecipes;
}

function calculateBasicStats(recipes) {
	const cuisines = {};
	const ingredients = {};
	const mealTypes = {};
	const difficulties = { easy: 0, medium: 0, hard: 0 };
	let totalCalories = 0;
	let totalPrepTime = 0;
	let totalCookTime = 0;
	let totalRating = 0;

	recipes.forEach(recipe => {
		// Cuisine stats
		cuisines[recipe.cuisine] = (cuisines[recipe.cuisine] || 0) + 1;

		// Difficulty stats
		if (recipe.difficulty) {
			difficulties[recipe.difficulty]++;
		}

		// Meal type stats
		if (recipe.mealType && Array.isArray(recipe.mealType)) {
			recipe.mealType.forEach(type => {
				mealTypes[type] = (mealTypes[type] || 0) + 1;
			});
		}

		// Ingredient stats
		if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
			recipe.ingredients.forEach(ingredient => {
				const name = ingredient.name.toLowerCase();
				ingredients[name] = (ingredients[name] || 0) + 1;
			});
		}

		// Nutrition and timing
		if (recipe.nutrition) {
			totalCalories += recipe.nutrition.calories || 0;
		}
		totalPrepTime += recipe.prepTime || 0;
		totalCookTime += recipe.cookTime || 0;
		totalRating += recipe.rating || 0;
	});

	const recipeCount = recipes.length;

	return {
		totalRecipes: recipeCount,
		cuisineBreakdown: Object.entries(cuisines)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10),
		popularIngredients: Object.entries(ingredients)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 20),
		mealTypeDistribution: Object.entries(mealTypes)
			.sort(([, a], [, b]) => b - a),
		difficultyBreakdown: difficulties,
		averages: {
			calories: Math.round(totalCalories / recipeCount),
			prepTime: Math.round(totalPrepTime / recipeCount),
			cookTime: Math.round(totalCookTime / recipeCount),
			rating: Math.round((totalRating / recipeCount) * 10) / 10,
		},
	};
}

function generateReport(stats) {
	console.log('\n🍳 WORLD PLATE DATA ANALYSIS REPORT');
	console.log('=====================================\n');

	console.log(`📊 Total Recipes: ${stats.totalRecipes}\n`);

	console.log('🌍 Top Cuisines:');
	stats.cuisineBreakdown.forEach(([cuisine, count]) => {
		const percentage = Math.round((count / stats.totalRecipes) * 100);
		console.log(`   ${cuisine}: ${count} recipes (${percentage}%)`);
	});

	console.log('\n🥘 Meal Type Distribution:');
	stats.mealTypeDistribution.forEach(([type, count]) => {
		console.log(`   ${type}: ${count} recipes`);
	});

	console.log('\n⭐ Difficulty Breakdown:');
	Object.entries(stats.difficultyBreakdown).forEach(([level, count]) => {
		const percentage = Math.round((count / stats.totalRecipes) * 100);
		console.log(`   ${level}: ${count} recipes (${percentage}%)`);
	});

	console.log('\n📈 Averages:');
	console.log(`   Calories: ${stats.averages.calories}`);
	console.log(`   Prep Time: ${stats.averages.prepTime} minutes`);
	console.log(`   Cook Time: ${stats.averages.cookTime} minutes`);
	console.log(`   Rating: ${stats.averages.rating}/5`);

	console.log('\n🔝 Most Popular Ingredients:');
	stats.popularIngredients.slice(0, 15).forEach(([ingredient, count]) => {
		console.log(`   ${ingredient}: used in ${count} recipes`);
	});

	console.log('\n✅ Analysis complete!\n');
}

function main() {
	console.log('📊 Analyzing recipe data...\n');

	try {
		const recipes = loadDataFiles();

		if (recipes.length === 0) {
			console.log('❌ No recipe data found!');
			process.exit(1);
		}

		const stats = calculateBasicStats(recipes);
		generateReport(stats);

	} catch (error) {
		console.error('❌ Analysis failed:', error.message);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}