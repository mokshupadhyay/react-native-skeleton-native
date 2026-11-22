// Fabric component spec for the group container. It has no props of its own:
// the native view holds the shared animation epoch and the coordinate space
// the highlight sweeps across. Children are ordinary React Native views.
import type { ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('SkeletonNativeGroup');
