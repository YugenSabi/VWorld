import { Box } from '@ui/layout';
import { Text } from '@ui/text';

interface CharacterCardProps {
  name: string;
  mood: string;
}

const moodConfig: Record<string, { color: string; symbol: string }> = {
  Friendly: { color: '#5aaa2a', symbol: '\u263A' },
  Angry: { color: '#cc4444', symbol: '\u2620' },
  Neutral: { color: '#6a6a8a', symbol: '\u25CB' },
  Happy: { color: '#ffe880', symbol: '\u2605' },
};

export const CharacterCardComponent = ({ name, mood }: CharacterCardProps) => {
  const moodState = moodConfig[mood] ?? moodConfig.Neutral;

  return (
    <Box
      alignItems='center'
      style={{
        gap: 8,
        padding: 8,
        background: '#1a1a2e',
        border: '2px solid #2a2a4a',
      }}
    >
      <Box
        width={30}
        height={30}
        alignItems='center'
        justifyContent='center'
        style={{
          flexShrink: 0,
          background: 'linear-gradient(135deg, #2a2a4a 0%, #1e1e3a 100%)',
          border: '2px solid #3a3a5a',
        }}
      >
        <Text
          as='span'
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: '0.6rem',
            color: '#5aaa2a',
            lineHeight: 1,
          }}
        >
          {name[0]}
        </Text>
      </Box>

      <Box flexDirection='column' style={{ gap: 3, minWidth: 0 }}>
        <Text as='span' style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '0.6rem', color: '#ffe880' }}>
          {name}
        </Text>
        <Text as='span' style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '0.4rem', color: moodState.color }}>
          {moodState.symbol} {mood}
        </Text>
      </Box>
    </Box>
  );
};
