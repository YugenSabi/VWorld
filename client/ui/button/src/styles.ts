import { CSSProperties } from 'react';
import { cssVarColor, cssVarFont } from '@ui/theme';
import { ButtonSize, ButtonVariant } from './types';

export function sizeStyle(size: ButtonSize): CSSProperties {
  switch (size) {
    case 'sm':
      return { height: 36, fontSize: 13, padding: '0 12px', gap: 6 };
    case 'lg':
      return { height: 56, fontSize: 16, padding: '0 18px', gap: 10 };
    case 'md':
    default:
      return { height: 44, fontSize: 14, padding: '0 14px', gap: 8 };
  }
}

export function variantStyle(variant: ButtonVariant): CSSProperties {
  switch (variant) {
    case 'filled':
      return {
        backgroundColor: cssVarColor('cardBg'),
        border: 'none',
        color: cssVarColor('secondaryText'),
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        border: 'none',
        color: cssVarColor('secondaryText'),
      };
    case 'outline':
    default:
      return {
        backgroundColor: cssVarColor('bg'),
        border: `1px solid ${cssVarColor('secondaryText')}`,
        color: cssVarColor('secondaryText'),
      };
  }
}

export function buttonBaseStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: cssVarFont('ui'),
    background: 'transparent',
    lineHeight: 1,
    userSelect: 'none',
    textDecoration: 'none',
  };
}
