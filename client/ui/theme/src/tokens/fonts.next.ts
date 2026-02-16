import localFont from 'next/font/local';
import { Press_Start_2P } from 'next/font/google';

export const pressStart2PFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin', 'cyrillic'],
  variable: '--ui-font-pixel',
  display: 'swap',
});
