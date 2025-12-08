import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import PantryMatcher from '../components/PantryMatcher';

export default function PantryPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PantryMatcher />
    </SafeAreaView>
  );
}
