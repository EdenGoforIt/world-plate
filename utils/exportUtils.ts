export function toCSV(items: Array<{ ingredient: string; totalAmount?: string; category?: string; recipes?: string[] }>): string {
  // CSV with headers: Ingredient,Amount,Category,Recipes
  const lines = [];
  lines.push('Ingredient,Amount,Category,Recipes');
  items.forEach((it) => {
    const ingredient = csvEscape(it.ingredient);
    const amount = csvEscape(it.totalAmount || '');
    const category = csvEscape(it.category || '');
    const recipes = csvEscape((it.recipes || []).join('; '));
    lines.push(`${ingredient},${amount},${category},${recipes}`);
  });
  return lines.join('\n');
}

function csvEscape(value?: string): string {
  if (!value) return '';
  const s = String(value);
  // If it contains comma, quote, newline, wrap in quotes and double existing quotes
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
