export type ColorTokenName =
  | 'bg'
  | 'base'
  | 'primaryText'
  | 'secondaryText'
  | 'mainCardBg'
  | 'cardBg'
  | 'errorText';
export type ColorToken = `$${ColorTokenName}`;
export type ColorValue = ColorToken | (string & {});

export function cssVarColor(value?: ColorValue): string | undefined {
  if (!value) return value;
  if (value.startsWith('$')) {
    const token = value.slice(1) as ColorTokenName;
    const fallback = COLOR_FALLBACKS[token];
    return `var(--ui-color-${token}, ${fallback})`;
  }
  return value;
}

const COLOR_FALLBACKS: Record<ColorTokenName, string> = {
  bg: '#F4F3E7',
  mainCardBg: '#AEA7A333',
  cardBg: '#D7CEC1',
  base: '#000000',
  primaryText: '#8B8177',
  secondaryText: '#2B2520CC',
  errorText: '#FF5445',
};

export type FontTokenName = 'rus' | 'eng';
export type FontToken = `$${FontTokenName}`;
export type FontValue = FontToken | (string & {});

export function cssVarFont(value?: FontValue): string | undefined {
  if (!value) return value;
  if (value.startsWith('$')) {
    const token = value.slice(1) as FontTokenName;
    return `var(--ui-font-${token})`;
  }
  return value;
}
