import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode, CSSProperties } from 'react';
import { ColorValue, FontValue, RadiusToken } from '@ui/theme';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'outline' | 'filled' | 'ghost';

type ButtonBaseProps = {
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;

  font?: FontValue;
  fontSize?: number | string;
  fontWeight?: CSSProperties['fontWeight'];

  textColor?: ColorValue;
  borderColor?: ColorValue;
  bg?: ColorValue;

  variant?: ButtonVariant;
  radius?: RadiusToken;

  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export type ButtonProps =
  | (ButtonBaseProps &
      Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'color' | 'type'> & {
        type?: 'button' | 'submit' | 'reset';
      })
  | (ButtonBaseProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color' | 'type'> & {
        type: 'link';
        href: string;
      });
