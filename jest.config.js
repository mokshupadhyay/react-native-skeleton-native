module.exports = {
  preset: '@react-native/jest-preset',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  modulePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/example/'],
  // The first render transforms React Native itself on a cold cache.
  testTimeout: 30000,
  watchman: false,
};
