'use client';

import { useState, useEffect } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { useTranslations } from 'next-intl';

export const ContentComponent = () => {
  const t = useTranslations('home');
  const title = t('title');
  const [visibleChars, setVisibleChars] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [blinkVisible, setBlinkVisible] = useState(true);

  useEffect(() => {
    if (visibleChars < title.length) {
      const timeout = setTimeout(() => setVisibleChars((c) => c + 1), 200);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timeout);
  }, [visibleChars, title.length]);

  useEffect(() => {
    if (showContent) return;
    const interval = setInterval(() => setBlinkVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [showContent]);

  return (
    <Box
      as='section'
      width='$full'
      minHeight='100dvh'
      flexDirection='column'
      alignItems='center'
      justifyContent='center'
    >
      <Box flexDirection='column' alignItems='flex-start' gap={32}>
        <Text as='div' color='$accentGreen' font='$pixel' fontSize='1.4rem'>
          {'> '}system.boot()
        </Text>

        <Text as='div' color='$textGold' font='$pixel' fontSize='1.4rem'>
          {'> '}{title.slice(0, visibleChars)}
          <Text
            as='span'
            color='$accentGreenBright'
            font='$pixel'
            style={{ opacity: blinkVisible && !showContent ? 1 : 0 }}
          >
            _
          </Text>
        </Text>

        <Text
          as='div'
          color='$textMuted'
          font='$pixel'
          fontSize='1.1rem'
          style={{ opacity: showContent ? 1 : 0, transition: 'opacity 0.5s' }}
        >
          {'> '}{t('subtitle')}
        </Text>

        <Box style={{ opacity: showContent ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}>
          <a href='/game' style={{ textDecoration: 'none' }}>
            <Text as='span' color='$accentGreenBright' font='$pixel' fontSize='1.4rem' letterSpacing='3px'>
              {'> [ '}{t('play')}{' ]'}
            </Text>
          </a>
        </Box>
      </Box>
    </Box>
  );
};
