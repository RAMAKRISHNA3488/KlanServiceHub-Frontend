/**
 * klanservicehub - Client Performance & Storage Optimization Engine
 *
 * Accelerates application response times, eliminates layout shifts (CLS),
 * and pre-warms routes/assets when performance cookies are accepted.
 */

const COOKIE_CONSENT_KEY = 'klanservicehub_cookie_consent';
const LAYOUT_CACHE_KEY = 'klanservicehub_layout_cache';

export const getCookieConsent = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCookieConsent = (preferences) => {
  if (typeof window === 'undefined') return;
  try {
    const consent = {
      necessary: true, // Always required for auth & tenant isolation
      performance: preferences.performance ?? true,
      functional: preferences.functional ?? true,
      telemetry: preferences.telemetry ?? true,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    
    // Dispatch event so live listeners can update immediately
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
    
    // Trigger performance engine with new settings
    applyPerformanceOptimizations(consent);
  } catch (err) {
    console.warn('[PerformanceOptimizer] Failed to persist cookie preferences:', err);
  }
};

/**
 * Intelligent Route Pre-warming Engine
 * Pre-fetches high-frequency routes during idle time or on navigation hover
 */
const prewarmedUrls = new Set();

export const prefetchRoute = (url) => {
  if (typeof window === 'undefined' || !url || prewarmedUrls.has(url)) return;
  
  const consent = getCookieConsent();
  // Only prefetch if performance consent is granted
  if (consent && consent.performance === false) return;

  prewarmedUrls.add(url);
  
  // Use <link rel="prefetch"> to quietly pre-warm the browser cache
  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);
  } catch {
    // Ignore non-critical prefetch failure
  }
};

/**
 * Workspace Layout & State Caching
 * Restores user density, sidebar, and column state with zero layout shifts
 */
export const getCachedLayout = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  const consent = getCookieConsent();
  if (consent && consent.functional === false) return fallback;

  try {
    const raw = localStorage.getItem(`${LAYOUT_CACHE_KEY}_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const setCachedLayout = (key, value) => {
  if (typeof window === 'undefined') return;
  const consent = getCookieConsent();
  if (consent && consent.functional === false) return;

  try {
    localStorage.setItem(`${LAYOUT_CACHE_KEY}_${key}`, JSON.stringify(value));
  } catch {
    // Storage quota or privacy sandbox
  }
};

/**
 * Apply runtime speed optimizations
 */
export const applyPerformanceOptimizations = (consent) => {
  if (typeof window === 'undefined') return;

  if (consent?.performance !== false) {
    // 1. Pre-warm key portal entrypoints during idle time
    const prewarmIdle = () => {
      const priorityRoutes = ['/sign-in', '/sign-up', '/terms', '/privacy'];
      priorityRoutes.forEach((route) => {
        prefetchRoute(route);
      });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prewarmIdle, { timeout: 2000 });
    } else {
      setTimeout(prewarmIdle, 1000);
    }

    // 2. Global hover-prefetch delegate for links with data-prefetch or internal hrefs
    const handleMouseOver = (e) => {
      const target = e.target.closest('a');
      if (target && target.href && target.origin === window.location.origin) {
        const path = target.pathname;
        if (path && path !== window.location.pathname) {
          prefetchRoute(path);
        }
      }
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
  }
};

/**
 * Initialize Performance Optimizer on application start
 */
export const initPerformanceOptimizer = () => {
  if (typeof window === 'undefined') return;
  const consent = getCookieConsent();
  // Default to optimized performance if not yet explicitly declined
  applyPerformanceOptimizations(consent || { performance: true, functional: true });
};
