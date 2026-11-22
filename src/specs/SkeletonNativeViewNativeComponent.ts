// Fabric component spec for one placeholder block. Codegen reads this file
// (`codegenConfig` in package.json); on the old architecture
// codegenNativeComponent falls back to requireNativeComponent.
import type { ColorValue, ViewProps } from 'react-native';
import type { Float, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
  baseColor?: ColorValue;
  highlightColor?: ColorValue;
  duration?: WithDefault<Int32, 1400>;
  direction?: WithDefault<'ltr' | 'rtl', 'ltr'>;
  angle?: WithDefault<Float, 20>;
  variant?: WithDefault<'shimmer' | 'pulse' | 'none', 'shimmer'>;
  animated?: WithDefault<boolean, true>;
  reduceMotion?: WithDefault<'system' | 'always' | 'never', 'system'>;
  cornerRadius?: WithDefault<Float, 0>;
}

export default codegenNativeComponent<NativeProps>('SkeletonNativeView');
