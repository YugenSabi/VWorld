export type FontTokenName = 'rus' | 'eng' | 'pixel';
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
