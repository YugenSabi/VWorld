export type ColorTokenName =
  | 'bg'
  | 'bgLight'
  | 'bgDark'
  | 'panelBg'
  | 'buttonBg'
  | 'infoBg'
  | 'infoBgDark'
  | 'mapBg'
  | 'border'
  | 'borderLight'
  | 'borderBrown'
  | 'borderBrownLight'
  | 'accentGreen'
  | 'accentGreenDark'
  | 'accentGreenLight'
  | 'accentGreenBright'
  | 'statusGreen'
  | 'statusGreenDark'
  | 'statusBorder'
  | 'textGold'
  | 'textMuted'
  | 'error'
  | 'errorText';

export type ColorToken = `$${ColorTokenName}`;
export type ColorValue = ColorToken | (string & {});

const COLOR_FALLBACKS: Record<ColorTokenName, string> = {
  bg: '#0e0e1a',
  bgLight: '#151525',
  bgDark: '#08080f',
  panelBg: '#1a1a2e',
  buttonBg: '#14142a',
  infoBg: '#171b30',
  infoBgDark: '#131728',
  mapBg: '#1a3a0e',
  border: '#2a2a4a',
  borderLight: '#3a3a5a',
  borderBrown: '#2a1204',
  borderBrownLight: '#5a3a18',
  accentGreen: '#5aaa2a',
  accentGreenDark: '#3a7a1a',
  accentGreenLight: '#7fd54a',
  accentGreenBright: '#05f711',
  statusGreen: '#3a6820',
  statusGreenDark: '#2d4a1a',
  statusBorder: '#4a8a28',
  textGold: '#ffe880',
  textMuted: '#6a6a8a',
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
