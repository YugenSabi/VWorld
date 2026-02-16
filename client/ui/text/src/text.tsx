import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import { cssVarColor, cssVarFont, type ColorValue, type FontValue } from '@ui/theme';

type TextTag = 'span' | 'div' | 'p' | 'label';

export type TextProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: TextTag;
  color?: ColorValue;
  font?: FontValue;
  fontSize?: CSSProperties['fontSize'];
  letterSpacing?: CSSProperties['letterSpacing'];
  textAlign?: CSSProperties['textAlign'];
  textShadow?: CSSProperties['textShadow'];
  children?: ReactNode;
};

export function Text({
  as = 'span',
  color,
  font,
  fontSize,
  letterSpacing,
  textAlign,
  textShadow,
  style,
  ...props
}: TextProps) {
  const nextStyle: CSSProperties = {
    color: cssVarColor(color),
    fontFamily: cssVarFont(font),
    fontSize,
    letterSpacing,
    textAlign,
    textShadow,
    ...style,
  };

  return createElement(as, { ...props, style: nextStyle });
}
