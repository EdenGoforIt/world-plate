import * as FileSystem from 'expo-file-system';
import { Platform, Share } from 'react-native';
import { ShoppingListItemPersist } from './storageUtils';

export function shoppingListToCSV(items: ShoppingListItemPersist[]): string {
  const header = ['ingredient', 'totalAmount', 'category', 'recipes', 'checked'];
  const rows = items.map((it) => [
    csvEscape(it.ingredient),
    csvEscape(it.totalAmount || ''),
    csvEscape(it.category || ''),
    csvEscape((it.recipes || []).join(';')),
    it.checked ? 'true' : 'false',
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function csvEscape(value: string) {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function shareShoppingListCSV(items: ShoppingListItemPersist[], filenamePrefix = 'shopping-list') {
  const csv = shoppingListToCSV(items);
  const name = `${filenamePrefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  const path = FileSystem.cacheDirectory + name;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

  // Use native Share API
  try {
    const options: any = { title: 'Share Shopping List' };
    if (Platform.OS === 'ios') options.url = path.replace('file://', '') === path ? `file://${path}` : path;
    else options.url = path; // Android accepts file path
    // Also provide message
    options.message = 'Shopping List CSV attached.';
    await Share.share(options as any);
  } finally {
    // keep file in cache (we might want to remove later) - do not delete automatically
  }
}
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
