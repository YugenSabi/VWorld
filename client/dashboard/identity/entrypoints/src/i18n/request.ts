import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const messages = (await import(`../../locales/${locale || 'ru'}.json`)).default;

  return {
    locale: locale || 'ru',
    messages,
    timeZone: 'UTC',
  };
});
