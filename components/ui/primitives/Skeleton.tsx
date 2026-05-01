'use client';

/**
 * components/ui/primitives/Skeleton.tsx — Vault Next
 * Shimmer loading placeholder.
 *
 * Sesi B — M-05
 */

import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?:  string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ width, height, circle = false, className, style, ...rest }: SkeletonProps) {
  return (
    <div
      className={clsx('skeleton', { 'skeleton--circle': circle }, className)}
      style={{
        width:        width,
        height:       height,
        borderRadius: circle ? '50%' : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}
