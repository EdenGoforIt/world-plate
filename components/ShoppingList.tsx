import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, TextInput, View } from 'react-native';
import { addItemsToShoppingList, getShoppingList, saveShoppingList, toggleShoppingListItemChecked } from '../utils/storageUtils';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';

interface PersistItem {
  ingredient: string;
  totalAmount?: string;
  category?: string;
  recipes?: string[];
}

export default function ShoppingList() {
  const [items, setItems] = useState<PersistItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState('');

  useEffect(() => {
    const load = async () => {
      const list = await getShoppingList();
      setItems(list as PersistItem[]);
    };
    load();
  }, []);

  const persist = async (newItems: PersistItem[]) => {
    setItems(newItems);
    await saveShoppingList(newItems);
  };

  const handleDelete = (index: number) => {
    const copy = [...items];
    const removed = copy.splice(index, 1);
    persist(copy);
    Alert.alert('Removed', `${removed[0].ingredient} removed`);
  };

  const handleToggleChecked = async (index: number) => {
    const copy = [...items];
    copy[index].checked = !copy[index].checked;
    setItems(copy);
    await toggleShoppingListItemChecked(copy[index].ingredient, !!copy[index].checked);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingAmount(items[index].totalAmount || '');
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const copy = [...items];
    copy[editingIndex] = { ...copy[editingIndex], totalAmount: editingAmount };
    persist(copy);
    setEditingIndex(null);
    setEditingAmount('');
  };

  const handleAddExampleItems = async () => {
    const example = [
      { ingredient: 'Tomato', totalAmount: '2', category: 'vegetable', recipes: ['Example'] },
    ];
    await addItemsToShoppingList(example);
    const list = await getShoppingList();
    setItems(list as PersistItem[]);
  };

  return (
    <ThemedView style={{ padding: 12 }}>
      <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Shopping List</ThemedText>
      <Button title="Add example item" onPress={handleAddExampleItems} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.ingredient}
        renderItem={({ item, index }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
            <ThemedText style={{ fontWeight: '600' }}>{item.ingredient}</ThemedText>
            <ThemedText style={{ color: '#666' }}>{item.category || 'other'} — {item.totalAmount || ''} — {item.recipes?.join(', ')}</ThemedText>

            {editingIndex === index ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput value={editingAmount} onChangeText={setEditingAmount} style={{ borderWidth: 1, borderColor: '#ccc', padding: 6, borderRadius: 6, width: 120 }} />
                <Button title="Save" onPress={confirmEdit} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Button title="Edit" onPress={() => startEditing(index)} />
                <Button title="Delete" color="#d00" onPress={() => handleDelete(index)} />
                <Button title={item.checked ? 'Uncheck' : 'Check'} onPress={() => handleToggleChecked(index)} />
              </View>
            )}
          </View>
        )}
      />
    </ThemedView>
  );
}
