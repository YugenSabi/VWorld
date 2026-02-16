export type RadiusToken = 'sm' | 'md' | 'lg' | 'pill';

const RADIUS_FALLBACKS: Record<RadiusToken, string> = {
  sm: '4px',
  md: '8px',
  lg: '30px',
  pill: '9999px',
};

export function cssVarRadius(token?: RadiusToken): string | undefined {
  if (!token) return undefined;
  return `var(--ui-radius-${token}, ${RADIUS_FALLBACKS[token]})`;
}
