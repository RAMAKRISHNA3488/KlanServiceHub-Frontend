import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export const Link = React.forwardRef(({ href, onClick, children, ...props }, ref) => {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    // If navigating to an external link or in-page hash anchor, skip auto top scroll
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
      return;
    }
    // Scroll window immediately to the top starting position
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  return (
    <RouterLink ref={ref} to={href} onClick={handleClick} {...props}>
      {children}
    </RouterLink>
  );
});

Link.displayName = 'Link';
export default Link;
