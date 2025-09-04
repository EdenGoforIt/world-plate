import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useShoppingList } from '@/hooks/useShoppingList';
import { ShoppingList, ShoppingListItem } from '@/types/ShoppingList';
import Loader from '@/components/ui/Loader';

export default function ShoppingListScreen() {
  const { 
    shoppingLists, 
    loading, 
    createShoppingList,
    deleteShoppingList,
    toggleItemChecked,
    removeItem,
    clearCheckedItems
  } = useShoppingList();
  
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  if (loading) {
    return <Loader />;
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }
    
    try {
      await createShoppingList(newListName.trim());
      setNewListName('');
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create shopping list');
    }
  };

  const handleDeleteList = (listId: string, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteShoppingList(listId);
            if (selectedList?.id === listId) {
              setSelectedList(null);
            }
          }
        }
      ]
    );
  };

  const handleClearChecked = (list: ShoppingList) => {
    const checkedCount = list.items.filter(item => item.checked).length;
    if (checkedCount === 0) {
      Alert.alert('Info', 'No checked items to clear');
      return;
    }
    
    Alert.alert(
      'Clear Checked Items',
      `Remove ${checkedCount} checked item${checkedCount !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => clearCheckedItems(list.id)
        }
      ]
    );
  };

  const renderListOverview = ({ item }: { item: ShoppingList }) => {
    const totalItems = item.items.length;
    const checkedItems = item.items.filter(i => i.checked).length;
    const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
    
    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 shadow-sm"
        onPress={() => setSelectedList(item)}
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-semibold text-text flex-1">{item.name}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteList(item.id, item.name)}
            className="p-1"
          >
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
        
        <Text className="text-sm text-text opacity-60 mb-3">
          {checkedItems} of {totalItems} items completed
        </Text>
        
        <View className="bg-gray-200 h-2 rounded-full">
          <View 
            className="bg-primary h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderShoppingItem = ({ item }: { item: ShoppingListItem }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-xl p-4 mb-2 shadow-sm"
      onPress={() => toggleItemChecked(selectedList!.id, item.id)}
    >
      <TouchableOpacity 
        className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
          item.checked ? 'bg-primary border-primary' : 'border-gray-300'
        }`}
        onPress={() => toggleItemChecked(selectedList!.id, item.id)}
      >
        {item.checked && <Ionicons name="checkmark" size={16} color="white" />}
      </TouchableOpacity>
      
      <View className="flex-1">
        <Text className={`text-base ${item.checked ? 'text-gray-400 line-through' : 'text-text'}`}>
          {item.amount} {item.name}
        </Text>
        <Text className="text-sm text-gray-400 mt-1">
          from {item.recipeName}
        </Text>
      </View>
      
      <TouchableOpacity
        className="p-2"
        onPress={() => removeItem(selectedList!.id, item.id)}
      >
        <Ionicons name="close" size={18} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const groupItemsByCategory = (items: ShoppingListItem[]) => {
    const categories: { [key: string]: ShoppingListItem[] } = {};
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  };

  const CreateListModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCreateModal}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-center px-5">
        <View className="bg-white rounded-3xl p-6">
          <Text className="text-xl font-bold text-text mb-4">Create New List</Text>
          
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
                setShowCreateModal(false);
                setNewListName('');
              }}
            >
              <Text className="text-center text-text font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl p-4"
              onPress={handleCreateList}
            >
              <Text className="text-center text-white font-semibold">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between p-5 pb-2">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => selectedList ? setSelectedList(null) : router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text">
            {selectedList ? selectedList.name : 'Shopping Lists'}
          </Text>
        </View>
        
        {selectedList ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleClearChecked(selectedList)}
              className="p-2"
            >
              <Ionicons name="checkmark-done" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="p-2"
          >
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {!selectedList ? (
        /* List Overview */
        <View className="flex-1 px-5">
          {shoppingLists.length > 0 ? (
            <FlatList
              data={shoppingLists}
              renderItem={renderListOverview}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="basket-outline" size={64} color={Colors.text + '40'} />
              <Text className="text-xl font-semibold text-text mt-4 mb-2">No Shopping Lists</Text>
              <Text className="text-center text-text opacity-60 mb-6">
                Create your first shopping list to get started
              </Text>
              <TouchableOpacity
                className="bg-primary rounded-xl px-6 py-3"
                onPress={() => setShowCreateModal(true)}
              >
                <Text className="text-white font-semibold">Create List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        /* List Details */
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {selectedList.items.length > 0 ? (
            Object.entries(groupItemsByCategory(selectedList.items)).map(([category, items]) => (
              <View key={category} className="mb-4">
                <Text className="text-lg font-semibold text-text mb-3 capitalize">
                  {category} ({items.length})
                </Text>
                {items.map(item => (
                  <View key={item.id}>
                    {renderShoppingItem({ item })}
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="basket-outline" size={64} color={Colors.text + '40'} />
              <Text className="text-xl font-semibold text-text mt-4 mb-2">Empty List</Text>
              <Text className="text-center text-text opacity-60">
                Add recipes to populate this list with ingredients
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      
      <CreateListModal />
    </SafeAreaView>
  );
}