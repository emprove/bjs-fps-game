const MOBILE_PORTRAIT_QUERY = "(max-width: 767px) and (orientation: portrait)";
const MOBILE_LANDSCAPE_QUERY = "(orientation: landscape) and (max-height: 767px)";
const DESKTOP_QUERY = "(min-width: 768px) and (pointer: fine)";
const TOUCH_QUERY = "(pointer: coarse)";
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const RETINA_QUERY = "(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
const PORTRAIT_QUERY = "(orientation: portrait)";
const LANDSCAPE_QUERY = "(orientation: landscape)";

export const isMobilePortrait = window.matchMedia(MOBILE_PORTRAIT_QUERY).matches;
export const isMobileLandscape = window.matchMedia(MOBILE_LANDSCAPE_QUERY).matches;
export const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
export const isTouchMedia = window.matchMedia(TOUCH_QUERY).matches;
export const isHoverable = window.matchMedia(HOVER_QUERY).matches;
export const isRetina = window.matchMedia(RETINA_QUERY).matches;
export const isPortrait = window.matchMedia(PORTRAIT_QUERY).matches;
export const isLandscape = window.matchMedia(LANDSCAPE_QUERY).matches;

export const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
export const isMobile = (isTouchMedia || hasTouch) && (isMobilePortrait || isMobileLandscape);
export const devicePixelRatio = window.devicePixelRatio || 1;
export const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);

export const device = {
  // Mobile/desktop by size & orientation
  isMobilePortrait,
  isMobileLandscape,
  isMobile,
  isDesktop,
  // Primary pointer and touch
  isTouchMedia,
  hasTouch,
  isHoverable,
  // Orientation
  isPortrait,
  isLandscape,
  // High DPI
  isRetina,
  devicePixelRatio,
  // Platform
  isIOS,
};
