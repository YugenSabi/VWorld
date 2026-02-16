import Image from 'next/image';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import worldMap from '@shared/images/world.gif';
import { useTranslations } from 'next-intl';

export const ViewportComponent = () => {
  const t = useTranslations('game.viewport');

  return (
    <Box as='section' flexDirection='column'>
      <Box
        alignItems='center'
        justifyContent='space-between'
        style={{
          gap: 10,
          padding: '8px 14px',
          background: 'linear-gradient(180deg, var(--ui-color-infoBg, #171b30) 0%, var(--ui-color-infoBgDark, #131728) 100%)',
          borderBottom: '2px solid var(--ui-color-borderBrown, #2a1204)',
          boxShadow: 'inset 0 -1px 0 var(--ui-color-accentGreenDark, #3a7a1a)',
        }}
      >
        <Text
          as='p'
          color='$textGold'
          font='$pixel'
          style={{
            margin: 0,
            fontSize: '0.7rem',
            letterSpacing: '2px',
            textShadow: '1px 1px 0 var(--ui-color-borderBrown, #2a1204)',
          }}
        >
          {t('locationName')}
        </Text>

        <Box
          as='div'
          alignItems='center'
          style={{
            gap: 14,
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: '0.7rem',
            letterSpacing: '1px',
            color: 'var(--ui-color-accentGreenLight, #7fd54a)',
          }}
        >
          <Text as='span'>{t('region')}</Text>
          <Text as='span'>{t('threat')}</Text>
        </Box>
      </Box>

      <Box
        as='div'
        position='relative'
        width='$full'
        backgroundColor='$mapBg'
        overflow='hidden'
        style={{
          aspectRatio: '4 / 3',
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Image
          src={worldMap}
          alt={t('mapAlt')}
          fill
          unoptimized
          draggable={false}
          style={{ objectFit: 'cover', imageRendering: 'pixelated' }}
        />
      </Box>
    </Box>
  );
};
