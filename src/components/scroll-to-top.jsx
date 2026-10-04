import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls window and container views to top (0, 0)
 * whenever the route or pathname changes, unless navigating to an explicit #hash.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Scroll window to starting top position
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    // Also reset scroll on root / body / main container if nested scrolling is active
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainContainers = document.querySelectorAll('main, .overflow-y-auto');
    mainContainers.forEach((container) => {
      container.scrollTop = 0;
    });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
