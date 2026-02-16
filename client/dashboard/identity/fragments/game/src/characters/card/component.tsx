import { Box } from '@ui/layout';
import { Text } from '@ui/text';

interface CharacterCardProps {
  name: string;
  mood: string;
}

export const CharacterCardComponent = ({ name, mood }: CharacterCardProps) => {
  return (
    <Box
      alignItems='center'
      gap={8}
      padding={8}
      backgroundColor='$panelBg'
      borderColor='$border'
      border='2px solid'
    >
      <Box
        width={28}
        height={28}
        flexShrink={0}
        backgroundColor='$border'
        borderColor='$borderLight'
        border='2px solid'
        style={{ imageRendering: 'pixelated' }}
      />

      <Box flexDirection='column' gap={3} minWidth={0}>
        <Text
          as='span'
          color='$textGold'
          font='$pixel'
          style={{ fontSize: '0.67rem', letterSpacing: '0.5px' }}
        >
          {name}
        </Text>
        <Text
          as='span'
          color='$accentGreen'
          font='$pixel'
          style={{ fontSize: '0.4rem', letterSpacing: '0.2px' }}
        >
          {mood}
        </Text>
      </Box>
    </Box>
  );
};
