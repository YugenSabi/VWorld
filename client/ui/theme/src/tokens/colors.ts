export type ColorTokenName =
  | 'bg'
  | 'base'
  | 'primaryText'
  | 'secondaryText'
  | 'mainCardBg'
  | 'cardBg'
  | 'buttonBg'
  | 'error'
  | 'errorText';

export type ColorToken = `$${ColorTokenName}`;
export type ColorValue = ColorToken | (string & {});

const COLOR_FALLBACKS: Record<ColorTokenName, string> = {
  bg: '#F4F3E7',
  mainCardBg: '#AEA7A333',
  cardBg: '#D7CEC1',
  base: '#000000',
  primaryText: '#8B8177',
  secondaryText: '#2B2520CC',
  buttonBg: '#2B2520CC',
  error: '#DC3545',
  errorText: '#DC3545',
};

export function cssVarColor(value?: ColorValue): string | undefined {
  if (!value) return value;
  if (value.startsWith('$')) {
    const token = value.slice(1) as ColorTokenName;
    return `var(--ui-color-${token}, ${COLOR_FALLBACKS[token]})`;
  }
  return value;
}
