import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useSmoothScroll } from './useSmoothScroll';

/** Navigate to a home-page section from anywhere in the app. */
export function useSectionNav() {
  const { scrollTo } = useSmoothScroll();
  const location = useLocation();
  const navigate = useNavigate();
  return useCallback(
    (anchor: string) => {
      if (location.pathname === '/' && !(location.state as { background?: unknown } | null)?.background) {
        scrollTo(anchor);
      } else {
        navigate('/', { state: { scrollTo: anchor } });
      }
    },
    [location, navigate, scrollTo],
  );
}
