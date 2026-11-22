// Fabric component spec for <Shimmer>: a container that draws the highlight
// over its children, masked to the pixels they draw.
import type { ColorValue, ViewProps } from 'react-native';
import type { Float, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
  highlightColor?: ColorValue;
  duration?: WithDefault<Int32, 1400>;
  direction?: WithDefault<'ltr' | 'rtl', 'ltr'>;
  angle?: WithDefault<Float, 20>;
  variant?: WithDefault<'shimmer' | 'pulse' | 'none', 'shimmer'>;
  animated?: WithDefault<boolean, true>;
  reduceMotion?: WithDefault<'system' | 'always' | 'never', 'system'>;
}

export default codegenNativeComponent<NativeProps>('SkeletonNativeShimmer');
