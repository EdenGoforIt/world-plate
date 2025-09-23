import { useRef } from 'react';
import { Animated } from 'react-native';

interface AnimatedScrollConfig {
  headerScaleRange?: [number, number];
  headerOpacityRange?: [number, number];
  scrollThreshold?: number;
}

export const useAnimatedScroll = (config: AnimatedScrollConfig = {}) => {
  const {
    headerScaleRange = [1, 0.9],
    headerOpacityRange = [1, 0.8],
    scrollThreshold = 100,
  } = config;

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerScale = scrollY.interpolate({
    inputRange: [0, scrollThreshold],
    outputRange: headerScaleRange,
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, scrollThreshold],
    outputRange: headerOpacityRange,
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return {
    scrollY,
    headerScale,
    headerOpacity,
    handleScroll,
  };
};