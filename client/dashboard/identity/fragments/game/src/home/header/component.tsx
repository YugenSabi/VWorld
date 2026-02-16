import { Box } from '@ui/layout';
import { Text } from '@ui/text';

const dots = [0, 1, 2];

export const HeaderComponent = () => {
  return (
    <Box
      as='header'
      alignItems='center'
      justifyContent='space-between'
      padding='10px 16px'
      backgroundColor='$panelBg'
      borderBottom='2px solid #5a3a18'
    >
      <Box gap={4}>
        {dots.map((value) => (
          <Box
            key={`left-${value}`}
            width={6}
            height={6}
            backgroundColor={value === 1 ? '$accentGreenDark' : '$accentGreen'}
          />
        ))}
      </Box>

      <Text
        as='span'
        color='$textGold'
        font='$pixel'
        fontSize='1.2rem'
        letterSpacing='6px'
        textShadow='2px 2px 0 #2a1204, 0 0 10px rgba(255, 232, 128, 0.15)'
      >
        VWORLD
      </Text>

      <Box gap={4}>
        {dots.map((value) => (
          <Box
            key={`right-${value}`}
            width={6}
            height={6}
            backgroundColor={value === 1 ? '$accentGreenDark' : '$accentGreen'}
          />
        ))}
      </Box>
    </Box>
  );
};
