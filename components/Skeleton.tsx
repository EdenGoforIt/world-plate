import React from 'react';
import { StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export default function Skeleton({ style }: { style?: any }) {
  const { width, height, borderRadius } = style || {};
  return (
    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item width={width || '100%'} height={height || 16} borderRadius={borderRadius || 8} />
    </SkeletonPlaceholder>
  );
}

const styles = StyleSheet.create({
  // fallback styles not used when using SkeletonPlaceholder
  skeleton: {
    backgroundColor: '#e6e9ee',
    borderRadius: 8,
  },
});
