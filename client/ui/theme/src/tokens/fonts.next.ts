import localFont from 'next/font/local';

export const delaGothicFont = localFont({
  src: '../fonts/DelaGothicOne-Regular.ttf',
  variable: '--ui-font-rus',
  display: 'swap',
});

export const underratedFont = localFont({
  src: '../fonts/UNDERRATED-UltraBold Personal Use.otf',
  variable: '--ui-font-eng',
  display: 'swap',
});
