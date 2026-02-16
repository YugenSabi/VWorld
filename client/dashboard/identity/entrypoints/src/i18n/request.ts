import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  return {
    locale: 'ru',
    messages: (await import('../../locales/ru.json')).default,
    timeZone: 'UTC',
  };
});
