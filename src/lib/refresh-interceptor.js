/**
 * Universal Refresh Animation Interceptor
 * Ensures that whenever a user clicks any "Refresh" button or refresh icon
 * anywhere in the application, the icon spins with a smooth 360-degree animation.
 */
let isInitialized = false;

export const initRefreshAnimationInterceptor = () => {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  document.addEventListener(
    'click',
    (event) => {
      try {
        const target = event.target;
        if (!target) return;

        // Check if target or any parent is a button or interactive element
        const interactiveEl = target.closest('button, a, [role="button"], .cursor-pointer') || target;

        // Inspect text, title, aria-label, and classes
        const text = (interactiveEl.innerText || interactiveEl.textContent || '').trim().toLowerCase();
        const title = (interactiveEl.getAttribute?.('title') || '').toLowerCase();
        const ariaLabel = (interactiveEl.getAttribute?.('aria-label') || '').toLowerCase();

        // Check for Lucide refresh icons
        const hasRefreshIcon = interactiveEl.querySelector?.(
          'svg.lucide-refresh-cw, svg.lucide-refresh-ccw, svg.lucide-rotate-ccw, svg.lucide-rotate-cw, [data-lucide="refresh-cw"]'
        ) || (target.tagName?.toLowerCase() === 'svg' && target.classList?.contains('lucide-refresh-cw'));

        const isRefreshButton =
          text.includes('refresh') ||
          text.includes('reload') ||
          title.includes('refresh') ||
          title.includes('reload') ||
          ariaLabel.includes('refresh') ||
          ariaLabel.includes('reload') ||
          Boolean(hasRefreshIcon);

        if (isRefreshButton) {
          // Locate the SVG icon inside the button, or target itself if SVG
          const icon =
            interactiveEl.querySelector?.('svg') ||
            (target.tagName?.toLowerCase() === 'svg' ? target : null) ||
            target.closest('svg') ||
            interactiveEl;

          if (icon) {
            // Remove previous animation classes
            icon.classList.remove('animate-refresh-spin');
            icon.classList.remove('animate-spin');

            // Force DOM reflow to restart animation seamlessly on repeated rapid clicks
            void icon.offsetWidth;

            // Apply spin animation
            icon.classList.add('animate-refresh-spin');

            setTimeout(() => {
              icon.classList.remove('animate-refresh-spin');
            }, 1320);
          }
        }
      } catch (err) {
        // Silently catch to prevent interference with event bubbling
      }
    },
    true // Use capture phase so it triggers reliably before or alongside any component handlers
  );
};
