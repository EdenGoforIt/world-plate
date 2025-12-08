import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { getPantryItems, savePantryItems } from '../utils/storageUtils';

export default function MyPantryPage() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const load = async () => {
      const p = await getPantryItems();
      setItems(p);
    };
    load();
  }, []);

  const handleAdd = async () => {
    const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const newItems = Array.from(new Set([...items, ...parts]));
    await savePantryItems(newItems);
    setItems(newItems);
    setInput('');
    Alert.alert('Saved', 'Pantry updated');
  };

  const handleRemove = async (index: number) => {
    const copy = [...items];
    const removed = copy.splice(index, 1);
    await savePantryItems(copy);
    setItems(copy);
    Alert.alert('Removed', `${removed[0]} removed`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ padding: 12 }}>
        <ThemedText style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>My Pantry</ThemedText>
        <ThemedText style={{ marginBottom: 6 }}>Enter items (comma-separated) and save to persist your pantry</ThemedText>
        <TextInput value={input} onChangeText={setInput} placeholder="eg. rice, tomato, onion" style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 }} />
        <Button title="Add to pantry" onPress={handleAdd} />

        <FlatList data={items} keyExtractor={(it) => it} renderItem={({ item, index }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <ThemedText>{item}</ThemedText>
            <Button title="Remove" color="#d00" onPress={() => handleRemove(index)} />
          </View>
        )} />
      </ThemedView>
    </SafeAreaView>
  );
}
