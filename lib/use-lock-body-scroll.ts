import { useEffect } from 'react';

export function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isLocked) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle === 'hidden' ? '' : originalStyle;
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isLocked]);
}
