'use client';

import {
  forwardRef,
  CSSProperties,
  ReactElement,
  cloneElement,
  isValidElement,
  type Ref,
} from 'react';

import { cssVarColor, cssVarFont, cssVarRadius } from '@ui/theme';

import { ButtonProps } from './types';
import { sizeStyle, variantStyle, buttonBaseStyle } from './styles';

const ICON_SIZE: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const ICON_SLOT: Record<'sm' | 'md' | 'lg', number> = {
  sm: 28,
  md: 32,
  lg: 40,
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      size = 'md',
      variant = 'filled',
      radius = 'md',
      fullWidth,
      disabled,

      font,
      fontSize,
      fontWeight,

      textColor,
      borderColor,
      bg,

      startIcon,
      endIcon,

      style,
      type,
      children,
      ...props
    },
    ref,
  ) => {
    const iconSlotSize = ICON_SLOT[size];
    const iconSize = ICON_SIZE[size];

    const baseStyles = buttonBaseStyle();
    const variantStyles = variantStyle(variant);

    const buttonStyles: CSSProperties = {
      ...baseStyles,
      ...sizeStyle(size),
      ...variantStyles,

      borderRadius: cssVarRadius(radius),
      width: fullWidth ? '100%' : undefined,

      fontFamily: cssVarFont(font) ?? baseStyles.fontFamily,
      fontSize,
      fontWeight,

      color: cssVarColor(textColor) ?? variantStyles.color,
      backgroundColor: cssVarColor(bg) ?? variantStyles.backgroundColor,
      borderColor: cssVarColor(borderColor) ?? variantStyles.borderColor,

      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : baseStyles.cursor,

      ...style,
    };

    const iconSlotStyle: CSSProperties = {
      width: iconSlotSize,
      minWidth: iconSlotSize,
      height: '100%',

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      pointerEvents: 'none',
      flexShrink: 0,
    };

    const renderIcon = (icon: ReactElement | string | number | null | undefined) => {
      if (!icon || !isValidElement(icon)) {
        return null;
      }

      return cloneElement(icon, {
        width: iconSize,
        height: iconSize,
        ...(icon.props || {}),
      });
    };

    const content = (
      <>
        {startIcon && <span style={iconSlotStyle}>{renderIcon(startIcon as ReactElement)}</span>}

        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </span>

        {endIcon && <span style={iconSlotStyle}>{renderIcon(endIcon as ReactElement)}</span>}
      </>
    );

    if (type === 'link') {
      const { href, target, rel, onClick, ...rest } = props as ButtonProps & {
        href: string;
      };

      const linkRel = target === '_blank' && !rel ? 'noopener noreferrer' : rel;

      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={linkRel}
          onClick={onClick}
          style={{
            ...buttonStyles,
            pointerEvents: disabled ? 'none' : buttonStyles.pointerEvents,
          }}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          {...rest}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        disabled={disabled}
        style={buttonStyles}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';
