module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 (used by react-native-fast-shimmer) needs the worklets plugin.
  plugins: ['react-native-worklets/plugin'],
};
