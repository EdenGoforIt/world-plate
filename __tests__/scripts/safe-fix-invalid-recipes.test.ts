const fs = require('fs');
const path = require('path');
const os = require('os');

const { run, summarizeReport } = require('../../scripts/safe-fix-invalid-recipes');

describe('safe-fix-invalid-recipes script', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('dry-run does not modify files and returns summary', () => {
    const dataFile = path.join(tmpDir, 'country.json');
    const payload = { country: 'T', flag: '🏳️', recipes: [ { id: 'r1', name: 'X', cuisine: 'C', mealType: ['dinner'], image: '', prepTime: 0, cookTime:0, servings:1, difficulty:'easy', ingredients:[], instructions:[], nutrition:{calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0}, tags:[], rating:0, reviews:0 } ] };
    fs.writeFileSync(dataFile, JSON.stringify(payload));
    const report = { overallOk: false, errors: [ { file: path.basename(dataFile), recipeId: 'r1', message: 'ingredients must be a non-empty array' } ] };
    fs.writeFileSync(path.join(tmpDir, 'validation-report.json'), JSON.stringify(report));

    // run dry
    run({ apply: false }, tmpDir);

    // original file still exists and contains the recipe
    const after = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    expect(after.recipes.length).toBe(1);
    // _invalid should not exist in dry run
    expect(fs.existsSync(path.join(tmpDir, '_invalid'))).toBe(false);
  });
});
