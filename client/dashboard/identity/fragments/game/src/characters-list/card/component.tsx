import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import type { AgentMood } from '@/schemas';

interface CharacterCardProps {
  name: string;
  mood: AgentMood;
  avatarUrl?: string;
  level?: number;
}

export const CharacterCardComponent = ({ name, mood, avatarUrl, level }: CharacterCardProps) => {
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
        width={42}
        height={42}
        flexShrink={0}
        backgroundColor='$border'
        borderColor='$borderLight'
        border='2px solid'
        overflow='hidden'
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              imageRendering: 'pixelated',
            }}
          />
        ) : null}
      </Box>

      <Box flexDirection='column' gap={10} minWidth={0}>
        <Box alignItems='center' gap={6}>
          <Text as='span' color='$textGold' font='$pixel' fontSize='0.74rem' letterSpacing='0.5px'>
            {name}
          </Text>
          {level !== undefined && (
            <Text as='span' color='$textMuted' font='$pixel' fontSize='0.6rem'>
              Lv.{level}
            </Text>
          )}
        </Box>

        <Text as='span' color='$accentGreen' font='$pixel' fontSize='0.6rem' letterSpacing='0.2px'>
          {mood}
        </Text>
      </Box>
    </Box>
  );
};
