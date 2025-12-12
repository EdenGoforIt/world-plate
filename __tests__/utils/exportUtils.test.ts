import { shoppingListToCSV } from '../../utils/exportUtils';

describe('exportUtils', () => {
  it('converts shopping list items to CSV correctly', () => {
    const items = [
      { ingredient: 'Tomato', totalAmount: '2', category: 'vegetable', recipes: ['R1'], checked: true },
      { ingredient: 'Milk, 1L', totalAmount: '1', category: 'dairy', recipes: ['R2', 'R3'], checked: false },
    ];
    const csv = shoppingListToCSV(items as any);
    expect(csv).toContain('ingredient,totalAmount,category,recipes,checked');
    expect(csv).toContain('Tomato');
    expect(csv).toContain('"Milk, 1L"');
    expect(csv).toContain('R2;R3');
  });
});
