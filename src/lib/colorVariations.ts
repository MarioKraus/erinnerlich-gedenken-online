/**
 * Generates deterministic color variations based on a string ID
 * All colors stay within the forest theme (greens, browns, warm tones)
 */

// Hash a string to a number
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Forest-themed hue ranges: greens (120-160), browns/warm (30-50), blue-greens (160-190)
const FOREST_HUES = [
  { min: 120, max: 155 }, // Forest greens
  { min: 30, max: 55 },   // Warm browns/autumn
  { min: 160, max: 185 }, // Teal/moss
  { min: 45, max: 70 },   // Golden autumn
];

/**
 * Get a deterministic hue value based on ID, within forest color palette
 */
export const getHueFromId = (id: string): number => {
  const hash = hashString(id);
  const rangeIndex = hash % FOREST_HUES.length;
  const range = FOREST_HUES[rangeIndex];
  const hueRange = range.max - range.min;
  return range.min + (hash % hueRange);
};

/**
 * Get CSS filter for color-shifting an image
 * Uses hue-rotate and sepia for a subtle, natural variation
 */
export const getImageColorFilter = (id: string): string => {
  const hash = hashString(id);
  const hueRotate = (hash % 40) - 20; // -20 to +20 degrees
  const sepia = 10 + (hash % 15); // 10-25%
  const saturate = 90 + (hash % 20); // 90-110%
  
  return `sepia(${sepia}%) hue-rotate(${hueRotate}deg) saturate(${saturate}%)`;
};

/**
 * Get overlay color for avatar placeholders
 * Returns an HSLA color string in forest tones
 */
export const getAvatarOverlayColor = (id: string): string => {
  const hue = getHueFromId(id);
  const hash = hashString(id);
  const saturation = 20 + (hash % 15); // 20-35%
  const lightness = 25 + (hash % 15); // 25-40%
  
  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.35)`;
};

/**
 * Get page-specific overlay gradient
 * Creates a subtle color tint for page backgrounds
 */
export const getPageOverlayGradient = (pageId: string): string => {
  const hue = getHueFromId(pageId);
  const hash = hashString(pageId);
  const saturation = 15 + (hash % 10); // 15-25%
  
  return `linear-gradient(
    to bottom,
    hsla(${hue}, ${saturation}%, 20%, 0.35),
    hsla(${hue}, ${saturation}%, 15%, 0.25),
    transparent
  )`;
};

/**
 * Predefined page color variations for consistent theming
 */
export const PAGE_COLORS = {
  index: { hue: 140, name: 'forest-green' },
  search: { hue: 160, name: 'moss' },
  create: { hue: 45, name: 'autumn-gold' },
  detail: { hue: 150, name: 'sage' },
  notFound: { hue: 35, name: 'autumn-brown' },
  admin: { hue: 170, name: 'pine' },
};
