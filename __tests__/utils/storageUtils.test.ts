import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    addItemsToNamedShoppingList,
    createShoppingList,
    deleteShoppingList,
    getActiveShoppingListName,
    getAllShoppingLists,
    getShoppingList,
    getShoppingListByName,
    renameShoppingList,
    saveShoppingListByName,
    setActiveShoppingListName,
    toggleShoppingListItemChecked,
} from '../../utils/storageUtils';

describe('storageUtils - named shopping lists', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.resetAllMocks();
  });

  it('migrates legacy single list to named lists (Default)', async () => {
    const legacyItems = [{ ingredient: 'Tomato' }];
    await AsyncStorage.setItem('@shopping_list', JSON.stringify(legacyItems));

    const lists = await getAllShoppingLists();
    expect(Object.keys(lists)).toContain('Default');
    expect(lists.Default).toEqual(legacyItems);
  });

  it('creates, renames, and deletes named shopping lists', async () => {
    await createShoppingList('Groceries');
    let lists = await getAllShoppingLists();
    expect(Object.keys(lists)).toContain('Groceries');

    await renameShoppingList('Groceries', 'Weekly');
    lists = await getAllShoppingLists();
    expect(Object.keys(lists)).toContain('Weekly');
    expect(Object.keys(lists)).not.toContain('Groceries');

    await deleteShoppingList('Weekly');
    lists = await getAllShoppingLists();
    expect(Object.keys(lists)).not.toContain('Weekly');
  });

  it('adds items to named list and merges recipes', async () => {
    await createShoppingList('Groceries');
    // Initial state: empty
    await addItemsToNamedShoppingList('Groceries', [{ ingredient: 'Tomato', recipes: ['R1'] }]);
    let groceries = await getShoppingListByName('Groceries');
    expect(groceries.length).toBe(1);
    expect(groceries[0].ingredient).toBe('Tomato');
    expect(groceries[0].recipes).toContain('R1');

    // Add same ingredient with another recipe -> should merge recipes
    await addItemsToNamedShoppingList('Groceries', [{ ingredient: 'Tomato', recipes: ['R2'] }]);
    groceries = await getShoppingListByName('Groceries');
    expect(groceries.length).toBe(1);
    expect(groceries[0].recipes).toEqual(expect.arrayContaining(['R1', 'R2']));
  });

  it('returns the active shopping list when getting shopping list', async () => {
    await createShoppingList('Groceries');
    await addItemsToNamedShoppingList('Groceries', [{ ingredient: 'Eggs', recipes: ['Omelet'] }]);
    await createShoppingList('Party');
    await addItemsToNamedShoppingList('Party', [{ ingredient: 'Beer', recipes: ['Party'] }]);
    await setActiveShoppingListName('Party');

    const active = await getActiveShoppingListName();
    expect(active).toBe('Party');

    const list = await getShoppingList();
    expect(list.map((i) => i.ingredient)).toContain('Beer');
    expect(list.map((i) => i.ingredient)).not.toContain('Eggs');
  });
});

describe('storageUtils: named shopping lists & migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('migrates legacy SHOPPING_LIST_KEY into named list Default', async () => {
    const legacy = [{ ingredient: 'Tomato', totalAmount: '2' }];
    await AsyncStorage.setItem('@shopping_list', JSON.stringify(legacy));

    const all = await getAllShoppingLists();
    expect(all).toHaveProperty('Default');
    expect(all.Default.length).toBe(1);
    const list = await getShoppingList();
    expect(list.length).toBe(1);
  });

  it('creates named shopping lists and sets active list', async () => {
    await createShoppingList('Groceries');
    const all = await getAllShoppingLists();
    expect(all).toHaveProperty('Groceries');

    await setActiveShoppingListName('Groceries');
    const active = await getActiveShoppingListName();
    expect(active).toBe('Groceries');
    const list = await getShoppingList();
    expect(Array.isArray(list)).toBe(true);
  });

  it('adds and merges items into named list', async () => {
    await createShoppingList('Groceries');
    await addItemsToNamedShoppingList('Groceries', [
      { ingredient: 'Tomato', totalAmount: '2', recipes: ['Recipe A'] },
    ]);
    await addItemsToNamedShoppingList('Groceries', [
      { ingredient: 'tomato', totalAmount: '', recipes: ['Recipe B'] },
    ]);
    const list = await getShoppingListByName('Groceries');
    expect(list.length).toBe(1);
    expect(list[0].recipes?.length).toBe(2);
  });

  it('toggles checked flag for a shopping list item', async () => {
    await createShoppingList('Groceries');
    await addItemsToNamedShoppingList('Groceries', [{ ingredient: 'Onion', recipes: ['R'] }]);
    await toggleShoppingListItemChecked('Onion', true);
    const list = await getShoppingListByName('Groceries');
    expect(list[0].checked).toBe(true);
  });

  it('renames and deletes shopping lists', async () => {
    await createShoppingList('Old');
    await saveShoppingListByName('Old', [{ ingredient: 'X' }]);
    await renameShoppingList('Old', 'New');
    const all = await getAllShoppingLists();
    expect(all).toHaveProperty('New');
    await deleteShoppingList('New');
    const after = await getAllShoppingLists();
    expect(after['New']).toBeUndefined();
  });
});
