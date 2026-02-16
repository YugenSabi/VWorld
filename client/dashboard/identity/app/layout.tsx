import type { Metadata } from 'next';
import { pressStart2PFont } from '@ui/theme/tokens/fonts.next';
import { NextIntlClientProvider } from 'next-intl';
import './globals.css';
import messages from '../entrypoints/locales/ru.json';

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
    <body className={`${pressStart2PFont.variable}`}>
    <NextIntlClientProvider locale='ru' messages={messages}>
      {children}
    </NextIntlClientProvider>
    </body>
    </html>
  );
}
