import type { Metadata } from 'next';
import { delaGothicFont, underratedFont } from '@ui/theme/tokens/fonts.next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VWorld',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ru'>
      <body className={`${delaGothicFont.variable} ${underratedFont.variable}`}>{children}</body>
    </html>
  );
}
