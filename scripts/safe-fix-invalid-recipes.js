#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data');
const REPORT_PATH = path.join(DATA_DIR, 'validation-report.json');
const BACKUP_DIR = path.join(DATA_DIR, '_backup');
const INVALID_DIR = path.join(DATA_DIR, '_invalid');

function readJSON(p) {
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, obj) {
	fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function ensureDir(p) {
	if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function normalizeMealTypeEntry(val) {
	if (!val) return null;
	const s = String(val).toLowerCase().trim();
	const map = {
		main: 'dinner',
		'main course': 'dinner',
		entree: 'dinner',
		starter: 'appetizer',
		starters: 'appetizer',
		sides: 'side',
		'side dish': 'side',
		'side-dish': 'side',
		snacks: 'snack',
		dessert: 'dessert',
		breakfast: 'breakfast',
		lunch: 'lunch',
		dinner: 'dinner',
		soup: 'soup',
		drink: 'drink',
		beverage: 'drink',
	};
	return map[s] || null;
}

function summarizeReport(report) {
	const byFile = {};
	(report.errors || []).forEach((e) => {
		byFile[e.file] = byFile[e.file] || [];
		byFile[e.file].push(e);
	});
	return byFile;
}

function timestamp() {
	return new Date().toISOString().replace(/[:.]/g, '-');
}

function run(options, dataDir = DEFAULT_DATA_DIR) {
	const reportPath = path.join(dataDir, 'validation-report.json');
	if (!fs.existsSync(reportPath)) {
		console.error('No validation report found at', reportPath);
		process.exit(1);
	}
	const report = readJSON(reportPath);
	if (!Array.isArray(report.errors) || report.errors.length === 0) {
		console.log('No errors to process in validation report.');
		return;
	}

	const grouped = summarizeReport(report);
	const summary = [];

	const backupDir = path.join(dataDir, '_backup');
	const invalidDir = path.join(dataDir, '_invalid');
	ensureDir(backupDir);
	ensureDir(invalidDir);

	Object.keys(grouped).forEach((file) => {
		const filePath = path.join(dataDir, file);
		if (!fs.existsSync(filePath)) {
			summary.push({ file, status: 'missing-file' });
			return;
		}
		const data = readJSON(filePath);
		if (!Array.isArray(data.recipes)) {
			summary.push({ file, status: 'no-recipes-array' });
			return;
		}

		// Backup original file
		const backupPath = path.join(backupDir, `${file}.${timestamp()}.bak.json`);
		fs.copyFileSync(filePath, backupPath);

		// Build index for duplicates detection
		const idCount = {};
		data.recipes.forEach((r) => { idCount[r.id] = (idCount[r.id] || 0) + 1; });

		const invalidRecipes = [];
		const keptRecipes = [];

		grouped[file].forEach((err) => {
			// no-op placeholder; we'll filter below
		});

		// Process each recipe, decide to keep, rename, or move
		data.recipes.forEach((recipe) => {
			const idsForFile = grouped[file].map((e) => e.recipeId);
			const isFlagged = idsForFile.includes(recipe.id);
			const actions = [];

			// fix mealType if it's a string
			if (typeof recipe.mealType === 'string') {
				const norm = normalizeMealTypeEntry(recipe.mealType);
				if (norm) {
					actions.push(`normalize mealType '${recipe.mealType}' -> ['${norm}']`);
					recipe.mealType = [norm];
				}
			}

			// normalize array entries
			if (Array.isArray(recipe.mealType)) {
				const normalized = recipe.mealType.map((m) => {
					const n = normalizeMealTypeEntry(m);
					return n || m;
				});
				recipe.mealType = Array.from(new Set(normalized));
			}

			// handle duplicate ids: if duplicate and flagged or count>1, rename safely
			if (idCount[recipe.id] > 1) {
				const newId = `${recipe.id}-dup-${timestamp()}`;
				actions.push(`rename id '${recipe.id}' -> '${newId}'`);
				recipe.id = newId;
				// decrement original count so further duplicates don't all get renamed again
				idCount[recipe.id] = (idCount[recipe.id] || 0) - 1;
			}

			// If flagged for missing ingredients or other blocking errors, move to invalid
			if (isFlagged) {
				const reasons = grouped[file].filter((e) => e.recipeId === recipe.id || e.recipeId === recipe.id.replace(/-dup-.*$/, '')).map(e => e.message);
				recipe.draft = true;
				recipe.validationNotes = (recipe.validationNotes || []).concat(reasons);
				invalidRecipes.push(recipe);
			} else {
				keptRecipes.push(recipe);
			}
		});

		// Write updated original file with kept recipes
		const updated = Object.assign({}, data, { recipes: keptRecipes });
		if (options.apply) {
			writeJSON(filePath, updated);
		}

		// Write invalid recipes into _invalid/<file>
		if (invalidRecipes.length > 0) {
			const invalidPath = path.join(invalidDir, file);
			const invalidPayload = { country: data.country || path.basename(file, '.json'), recipes: invalidRecipes };
			if (options.apply) {
				writeJSON(invalidPath, invalidPayload);
			}
		}

		summary.push({ file, kept: keptRecipes.length, moved: invalidRecipes.length, backup: backupPath });
	});

	// Print summary
	console.log('Safe-fix summary (dry-run=', !options.apply, '):');
	summary.forEach((s) => console.log('-', s.file, `kept:${s.kept || 0}`, `moved:${s.moved || 0}`));

	if (options.apply) {
		console.log('Applied changes. Backups stored in', BACKUP_DIR, '. Moved invalid files to', INVALID_DIR);
	} else {
		console.log('No changes applied. Run with --apply to apply non-destructive fixes.');
	}
}

// Exports for unit testing and programmatic use
module.exports = {
	run,
	normalizeMealTypeEntry,
	summarizeReport,
};

if (require.main === module) {
	const args = process.argv.slice(2);
	const options = { apply: args.includes('--apply') };
	run(options);
}
