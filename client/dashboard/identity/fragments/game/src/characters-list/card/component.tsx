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
        width={62}
        height={62}
        flexShrink={0}
        backgroundColor='$border'
        borderColor='$borderLight'
        border='2px solid'
      />

      <Box flexDirection='column' gap={10} minWidth={0}>
        <Text as='span' color='$textGold' font='$pixel' fontSize='0.74rem' letterSpacing='0.5px'>
          {name}
        </Text>
        <Text as='span' color='$accentGreen' font='$pixel' fontSize='0.6rem' letterSpacing='0.2px'>
          {mood}
        </Text>
      </Box>
    </Box>
  );
};
