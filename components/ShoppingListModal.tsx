import { Colors } from "@/constants/Colors";
import { useShoppingList } from "@/hooks/useShoppingList";
import { Recipe } from "@/types/Recipe";
import { ShoppingList } from "@/types/ShoppingList";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ShoppingListModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  visible,
  onClose,
  recipe,
}) => {
  const { shoppingLists, createShoppingList, addRecipeToShoppingList } =
    useShoppingList();
  const [newListName, setNewListName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleAddToList = async (list: ShoppingList) => {
    await addRecipeToShoppingList(list.id, recipe);
    Alert.alert("Success", `Added ${recipe.name} ingredients to ${list.name}`);
    onClose();
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) {
      Alert.alert("Error", "Please enter a list name");
      return;
    }

    try {
      const newList = await createShoppingList(newListName.trim());
      await addRecipeToShoppingList(newList.id, recipe);
      Alert.alert(
        "Success",
        `Created "${newListName}" and added ${recipe.name} ingredients`
      );
      setNewListName("");
      setShowCreateForm(false);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to create shopping list");
    }
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const itemCount = item.items.length;
    const checkedCount = item.items.filter((i) => i.checked).length;

    return (
      <TouchableOpacity
        className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-3 shadow-sm"
        onPress={() => handleAddToList(item)}
      >
        <View className="flex-1">
          <Text className="text-base font-semibold text-text mb-1">
            {item.name}
          </Text>
          <Text className="text-sm text-text opacity-60">
            {itemCount} items • {checkedCount} checked
          </Text>
        </View>
        <Ionicons name="add" size={24} color={Colors.primary} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-white rounded-t-3xl max-h-[70%]">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="text-xl font-bold text-text">
              Add to Shopping List
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View className="p-5">
            <View className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-4">
              <View className="bg-primary/10 p-2 rounded-lg mr-3">
                <Ionicons name="restaurant" size={20} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-text">
                  {recipe.name}
                </Text>
                <Text className="text-sm text-text opacity-60">
                  {recipe.ingredients.length} ingredients
                </Text>
              </View>
            </View>

            {!showCreateForm ? (
              <>
                <TouchableOpacity
                  className="bg-primary rounded-xl p-4 mb-4 flex-row items-center justify-center"
                  onPress={() => setShowCreateForm(true)}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color="white"
                    className="mr-2"
                  />
                  <Text className="text-white font-semibold">
                    Create New List
                  </Text>
                </TouchableOpacity>

                {shoppingLists.length > 0 ? (
                  <>
                    <Text className="text-base font-semibold text-text mb-3">
                      Or add to existing list:
                    </Text>
                    <FlatList
                      data={shoppingLists}
                      renderItem={renderListItem}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 200 }}
                    />
                  </>
                ) : (
                  <Text className="text-center text-text opacity-60 py-4">
                    No shopping lists yet. Create your first one!
                  </Text>
                )}
              </>
            ) : (
              <View>
                <Text className="text-base font-semibold text-text mb-3">
                  Create New List
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-base text-text mb-4"
                  placeholder="Enter list name..."
                  value={newListName}
                  onChangeText={setNewListName}
                  autoFocus
                />
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 rounded-xl p-4"
                    onPress={() => {
                      setShowCreateForm(false);
                      setNewListName("");
                    }}
                  >
                    <Text className="text-center text-text font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-xl p-4"
                    onPress={handleCreateAndAdd}
                  >
                    <Text className="text-center text-white font-semibold">
                      Create & Add
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
