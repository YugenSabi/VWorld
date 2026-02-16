import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import { cssVarColor, type ColorValue } from '@ui/theme';

type BoxTag = 'div' | 'section' | 'main' | 'header' | 'footer';

type SizeToken = '$full';
type CssSize = number | string | SizeToken;

function toCssSize(v: CssSize | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (v === '$full') return '100%';
  return typeof v === 'number' ? `${v}px` : v;
}

export type BoxProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: BoxTag;

  display?: CSSProperties['display'];
  position?: CSSProperties['position'];
  inset?: CSSProperties['inset'];
  zIndex?: CSSProperties['zIndex'];
  pointerEvents?: CSSProperties['pointerEvents'];
  overflow?: CSSProperties['overflow'];

  width?: CssSize;
  height?: CssSize;
  minWidth?: CssSize;
  minHeight?: CssSize;
  maxWidth?: CssSize;
  maxHeight?: CssSize;

  backgroundColor?: ColorValue;
  color?: ColorValue;
  borderColor?: ColorValue;

  flexDirection?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  flexWrap?: CSSProperties['flexWrap'];
  gap?: CssSize;
  flexGrow?: CSSProperties['flexGrow'];
  flexShrink?: CSSProperties['flexShrink'];
  flexBasis?: CssSize;

  padding?: CssSize;
  paddingTop?: CssSize;
  paddingRight?: CssSize;
  paddingBottom?: CssSize;
  paddingLeft?: CssSize;

  margin?: CssSize;
  marginTop?: CssSize;
  marginRight?: CssSize;
  marginBottom?: CssSize;
  marginLeft?: CssSize;

  borderRadius?: CssSize;
  border?: CSSProperties['border'];

  children?: ReactNode;
};

export function Box({
  as = 'div',
  display = 'flex',
  position,
  inset,
  zIndex,
  pointerEvents,
  overflow,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  backgroundColor,
  color,
  borderColor,
  flexDirection,
  alignItems,
  justifyContent,
  flexWrap,
  gap,
  flexGrow,
  flexShrink,
  flexBasis,
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  borderRadius,
  border,
  style,
  ...props
}: BoxProps) {
  const nextStyle: CSSProperties = {
    boxSizing: 'border-box',
    display,
    position,
    inset,
    zIndex,
    pointerEvents,
    overflow,

    width: toCssSize(width),
    height: toCssSize(height),
    minWidth: toCssSize(minWidth),
    minHeight: toCssSize(minHeight),
    maxWidth: toCssSize(maxWidth),
    maxHeight: toCssSize(maxHeight),

    flexDirection,
    alignItems,
    justifyContent,
    flexWrap,
    gap: toCssSize(gap),
    flexGrow,
    flexShrink,
    flexBasis: toCssSize(flexBasis),

    padding: toCssSize(padding),
    paddingTop: toCssSize(paddingTop),
    paddingRight: toCssSize(paddingRight),
    paddingBottom: toCssSize(paddingBottom),
    paddingLeft: toCssSize(paddingLeft),

    margin: toCssSize(margin),
    marginTop: toCssSize(marginTop),
    marginRight: toCssSize(marginRight),
    marginBottom: toCssSize(marginBottom),
    marginLeft: toCssSize(marginLeft),

    borderRadius: toCssSize(borderRadius),
    border,
    borderColor: cssVarColor(borderColor),

    backgroundColor: cssVarColor(backgroundColor),
    color: cssVarColor(color),

    ...style,
  };

  return createElement(as, { ...props, style: nextStyle });
}
