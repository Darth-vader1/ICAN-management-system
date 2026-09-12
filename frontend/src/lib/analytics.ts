/**
 * Lightweight Privacy-Preserving Web Analytics Module
 * Supports Vercel Web Analytics, custom page view tracking, and event logging
 */

declare global {
  interface Window {
    va?: (action: string, params: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export const analytics = {
  /**
   * Log pageview on route change
   */
  trackPageView(path: string) {
    if (typeof window === 'undefined') return;

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics PageView] ${path}`);
      return;
    }

    // Vercel Analytics hook if initialized
    if (window.va) {
      window.va('pageview', { path });
    }

    // Google Analytics hook if GA_MEASUREMENT_ID configured
    if (window.gtag && import.meta.env.VITE_GA_MEASUREMENT_ID) {
      window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
        page_path: path,
      });
    }
  },

  /**
   * Track custom user action event (e.g. payment completed, course enrolled)
   */
  trackEvent(eventName: string, properties?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;

    if (import.meta.env.DEV) {
      console.log(`[Analytics Event] ${eventName}`, properties);
      return;
    }

    if (window.va) {
      window.va('event', { name: eventName, ...properties });
    }

    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }
  },
};
