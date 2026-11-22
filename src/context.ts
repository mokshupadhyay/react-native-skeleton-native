import { createContext, useContext } from 'react';
import type { SkeletonAnimationProps } from './types';

export interface GroupContextValue {
  /** Props set on <SkeletonGroup>, inherited by every skeleton inside it. */
  props: SkeletonAnimationProps;
}

export const SkeletonGroupContext = createContext<GroupContextValue | null>(null);

export function useSkeletonGroup(): GroupContextValue | null {
  return useContext(SkeletonGroupContext);
}
