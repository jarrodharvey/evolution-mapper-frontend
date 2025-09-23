/**
 * Mobile detection utility
 * Detects if the user is on a mobile device based on user agent and screen size
 */

export const isMobile = () => {
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Check screen width (consider devices under 768px as mobile)
  const smallScreen = window.innerWidth <= 768;

  // Consider touch capability
  const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Return true if any mobile indicator is present
  return mobileUserAgent || (smallScreen && touchCapable);
};

export const isMobileViewport = () => {
  // Simple viewport-based check for responsive behavior
  return window.innerWidth <= 768;
};