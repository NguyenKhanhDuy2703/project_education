import { useState, useEffect, type RefObject } from 'react';

export type ContainerBreakpoint = 'small' | 'medium' | 'wide';

export interface ContainerBreakpointOptions {
  smallThreshold?: number; // default: 768
  wideThreshold?: number; // default: 1024
}

export function useContainerBreakpoint(
  containerRef: RefObject<HTMLElement | null>,
  options?: ContainerBreakpointOptions
): { breakpoint: ContainerBreakpoint; containerWidth: number } {
  const smallThreshold = options?.smallThreshold ?? 768;
  const wideThreshold = options?.wideThreshold ?? 1024;

  const getBreakpoint = (w: number): ContainerBreakpoint => {
    if (w < smallThreshold) return 'small';
    if (w < wideThreshold) return 'medium';
    return 'wide';
  };

  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const updateFromContainerOrWindow = () => {
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) {
          setWidth(rect.width);
          return;
        }
      }
      if (typeof window !== 'undefined') {
        setWidth(window.innerWidth);
      }
    };

    updateFromContainerOrWindow();

    const handleWindowResize = () => {
      updateFromContainerOrWindow();
    };
    window.addEventListener('resize', handleWindowResize);

    const el = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      try {
        observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const entryWidth = entry.contentRect?.width ?? entry.target.getBoundingClientRect().width;
            if (entryWidth > 0) {
              setWidth(entryWidth);
            }
          }
        });
        observer.observe(el);
      } catch {}
    }

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      observer?.disconnect();
    };
  }, [containerRef]);

  return {
    breakpoint: getBreakpoint(width),
    containerWidth: width,
  };
}
