const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateFile, _resetErrorLog, errorLog } = require('../../scripts/validate-recipes.js');

describe('validate-recipes script', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-'));
    _resetErrorLog();
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('validates a good recipe file', () => {
    const file = path.join(tmpDir, 'test.json');
    const payload = {
      country: 'Testland',
      flag: '🏳️',
      recipes: [
        {
          id: 't-1',
          name: 'Test Dish',
          cuisine: 'Testian',
          mealType: ['dinner'],
          image: 'https://example.com/img.jpg',
          prepTime: 10,
          cookTime: 10,
          servings: 2,
          difficulty: 'easy',
          ingredients: [{ name: 'Ingredient', amount: '1', category: 'other' }],
          instructions: ['do it'],
          nutrition: { calories: 100, protein: 5, carbs: 10, fat: 2, fiber: 1, sugar: 1, sodium: 10 },
          tags: [],
          rating: 4.5,
          reviews: 1
        }
      ]
    };
    fs.writeFileSync(file, JSON.stringify(payload));
    const ok = validateFile(file);
    expect(ok).toBe(true);
    expect(errorLog.length).toBe(0);
  });

  it('detects missing ingredients error', () => {
    const file = path.join(tmpDir, 'bad.json');
    const payload = {
      country: 'Badland',
      flag: '🏳️',
      recipes: [
        {
          id: 'b-1',
          name: 'Bad Dish',
          cuisine: 'Badian',
          mealType: ['dinner'],
          image: 'https://example.com/img.jpg',
          prepTime: 10,
          cookTime: 10,
          servings: 2,
          difficulty: 'easy',
          ingredients: [],
          instructions: ['do it'],
          nutrition: { calories: 100, protein: 5, carbs: 10, fat: 2, fiber: 1, sugar: 1, sodium: 10 },
          tags: [],
          rating: 4.5,
          reviews: 1
        }
      ]
    };
    fs.writeFileSync(file, JSON.stringify(payload));
    const ok = validateFile(file);
    expect(ok).toBe(false);
    expect(errorLog.some(e => e.message.includes('ingredients must be a non-empty array'))).toBe(true);
  });
});
