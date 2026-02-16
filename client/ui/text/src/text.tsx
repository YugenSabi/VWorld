import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import { cssVarColor, cssVarFont, type ColorValue, type FontValue } from '@ui/theme';

type TextTag = 'span' | 'div' | 'p' | 'label';

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: TextTag;
  color?: ColorValue;
  font?: FontValue;
  children?: ReactNode;
};

export function Text({ as = 'span', color, font, style, ...props }: TextProps) {
  const nextStyle: CSSProperties = {
    color: cssVarColor(color),
    fontFamily: cssVarFont(font),
    ...style,
  };

  return createElement(as, { ...props, style: nextStyle });
}
