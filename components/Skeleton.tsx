import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function Skeleton({ style }: { style?: any }) {
  return <View style={[styles.skeleton, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e6e9ee',
    borderRadius: 8,
  },
});
