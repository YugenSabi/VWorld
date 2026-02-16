import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import { cssVarColor, type ColorValue } from '@ui/theme';

type BoxTag = 'div' | 'section' | 'main' | 'header' | 'footer' | 'aside';

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

  top?: CssSize;
  left?: CssSize;
  right?: CssSize;
  bottom?: CssSize;

  width?: CssSize;
  height?: CssSize;
  minWidth?: CssSize;
  minHeight?: CssSize;
  maxWidth?: CssSize;
  maxHeight?: CssSize;
  aspectRatio?: CSSProperties['aspectRatio'];

  background?: CSSProperties['background'];
  backgroundColor?: ColorValue;
  color?: ColorValue;
  borderColor?: ColorValue;
  boxShadow?: CSSProperties['boxShadow'];
  cursor?: CSSProperties['cursor'];

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
  borderTop?: CSSProperties['borderTop'];
  borderBottom?: CSSProperties['borderBottom'];

  transform?: CSSProperties['transform'];

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
  top,
  left,
  right,
  bottom,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  aspectRatio,
  background,
  backgroundColor,
  color,
  borderColor,
  boxShadow,
  cursor,
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
  borderTop,
  borderBottom,
  transform,
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

    top: toCssSize(top),
    left: toCssSize(left),
    right: toCssSize(right),
    bottom: toCssSize(bottom),

    width: toCssSize(width),
    height: toCssSize(height),
    minWidth: toCssSize(minWidth),
    minHeight: toCssSize(minHeight),
    maxWidth: toCssSize(maxWidth),
    maxHeight: toCssSize(maxHeight),
    aspectRatio,

    background,
    backgroundColor: cssVarColor(backgroundColor),
    color: cssVarColor(color),
    borderColor: cssVarColor(borderColor),
    boxShadow,
    cursor,

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
    borderTop,
    borderBottom,

    transform,

    ...style,
  };

  return createElement(as, { ...props, style: nextStyle });
}
