/**
 * @format
 */
import { AppRegistry, StyleSheet } from 'react-native';

// React Native 0.88 removed StyleSheet.absoluteFillObject, which
// react-native-skeleton-placeholder 5.2.4 spreads into its moving gradient
// style. Without it the gradient has no size and no highlight is drawn. This
// shim restores the old value so that library can be compared at all.
if (StyleSheet.absoluteFillObject == null) {
  try {
    Object.defineProperty(StyleSheet, 'absoluteFillObject', {
      value: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    });
  } catch (e) {
    console.warn('could not add StyleSheet.absoluteFillObject', e);
  }
}

const { name: appName } = require('./app.json');
const App = require('./App').default;

AppRegistry.registerComponent(appName, () => App);
