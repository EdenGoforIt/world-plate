import React, { useMemo, useState } from 'react';
import { Alert, Button, FlatList, TextInput, View } from 'react-native';
import recipesData from '../data/recipes.json';
import { matchRecipesByPantry } from '../utils/pantryMatcher';
import { addItemsToShoppingList } from '../utils/storageUtils';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';

export default function PantryMatcher() {
  const [input, setInput] = useState('');
  const [maxMissing, setMaxMissing] = useState('2');

  const pantryItems = useMemo(() =>
    input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    [input]
  );

  const matches = useMemo(() => {
    if (pantryItems.length === 0) return [];
    return matchRecipesByPantry(recipesData.recipes, pantryItems, {
      maxMissing: Number(maxMissing || 2),
    }).slice(0, 20);
  }, [pantryItems, maxMissing]);

  return (
    <ThemedView style={{ padding: 12 }}>
      <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Pantry Matcher</ThemedText>
      <ThemedText style={{ marginBottom: 6 }}>Enter pantry items (comma-separated):</ThemedText>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="eg. rice, tomato, onion"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 8,
          borderRadius: 6,
          marginBottom: 8,
        }}
      />

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <ThemedText>Max missing:</ThemedText>
        <TextInput
          value={maxMissing}
          onChangeText={setMaxMissing}
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 6,
            borderRadius: 6,
            width: 64,
          }}
        />
      </View>

      {pantryItems.length === 0 ? (
        <ThemedText>No pantry items entered yet.</ThemedText>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.recipe.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>{item.recipe.name}</ThemedText>
              <ThemedText>{item.matchPercent}% match — {item.missingCount} missing</ThemedText>
              {item.missingIngredients.length > 0 && (
                <ThemedText style={{ color: '#666' }}>Missing: {item.missingIngredients.slice(0,5).join(', ')}{item.missingIngredients.length>5? '...': ''}</ThemedText>
              )}
              <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
                <Button
                  title="Add missing to shopping list"
                  onPress={async () => {
                    if (item.missingIngredients.length === 0) {
                      Alert.alert('Nothing to add', 'This recipe has no missing ingredients.');
                      return;
                    }

                    const toAdd = item.missingIngredients.map((ing) => ({
                      ingredient: ing.charAt(0).toUpperCase() + ing.slice(1),
                      totalAmount: '',
                      category: 'other',
                      recipes: [item.recipe.name],
                    }));

                    try {
                      await addItemsToShoppingList(toAdd);
                      Alert.alert('Added', `Added ${toAdd.length} items to your shopping list.`);
                    } catch (e) {
                      console.error(e);
                      Alert.alert('Error', 'Could not add items to shopping list.');
                    }
                  }}
                />
              </View>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}
