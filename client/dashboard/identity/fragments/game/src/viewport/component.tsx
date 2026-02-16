import Image from 'next/image';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import worldMap from '@shared/images/Fontain.gif';
import { useTranslations } from 'next-intl';
import { PlayerComponent } from '../player';

export const ViewportComponent = () => {
  const t = useTranslations('game.viewport');

  return (
    <Box as='section' flexDirection='column'>
      <Box
        alignItems='center'
        justifyContent='space-between'
        gap={10}
        padding='8px 14px'
        background='linear-gradient(180deg, var(--ui-color-infoBg, #171b30) 0%, var(--ui-color-infoBgDark, #131728) 100%)'
        borderBottom='2px solid var(--ui-color-borderBrown, #2a1204)'
        boxShadow='inset 0 -2px 0 var(--ui-color-accentGreenDark, #3a7a1a)'
      >
        <Text
          as='div'
          color='$textGold'
          font='$pixel'
          fontSize='0.7rem'
          letterSpacing='2px'
          textShadow='1px 1px 0 var(--ui-color-borderBrown, #2a1204)'
        >
          {t('locationName')}
        </Text>

        <Box alignItems='center' gap={14}>
          <Text as='span' color='$accentGreenLight' font='$pixel' fontSize='0.7rem' letterSpacing='1px'>
            {t('region')}
          </Text>
          <Text as='span' color='$accentGreenLight' font='$pixel' fontSize='0.7rem' letterSpacing='1px'>
            {t('weather')}
          </Text>
        </Box>
      </Box>

      <Box
        position='relative'
        width='$full'
        backgroundColor='$mapBg'
        overflow='hidden'
        aspectRatio='5.5 / 3'
        boxShadow='inset 0 0 40px rgba(0, 0, 0, 0.5)'
      >
        <Image
          src={worldMap}
          alt={t('mapAlt')}
          fill
          unoptimized
          draggable={false}
          style={{ objectFit: 'cover', imageRendering: 'pixelated' }}
        />
        <PlayerComponent />
      </Box>
    </Box>
  );
};
