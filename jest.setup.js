import '@testing-library/jest-native/extend-expect';

// Mock expo modules
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
  loadAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Silence console during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
};