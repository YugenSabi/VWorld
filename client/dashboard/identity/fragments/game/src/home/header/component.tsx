import { Box } from '@ui/layout';
import { Text } from '@ui/text';

const dots = [0, 1, 2];

export const HeaderComponent = () => {
  return (
    <Box
      as='header'
      alignItems='center'
      justifyContent='space-between'
      style={{
        padding: '10px 16px',
        background: 'linear-gradient(180deg, #1e1e34 0%, #1a1a2e 100%)',
        borderBottom: '2px solid #5a3a18',
      }}
    >
      <Box gap={4}>
        {dots.map((value) => (
          <Box key={`left-${value}`} width={6} height={6} style={{ background: value === 1 ? '#3a7a1a' : '#5aaa2a' }} />
        ))}
      </Box>

      <Text
        as='span'
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: '1.2rem',
          color: '#ffe880',
          letterSpacing: '6px',
          textShadow: '2px 2px 0 #2a1204, 0 0 10px rgba(255, 232, 128, 0.15)',
        }}
      >
        VWORLD
      </Text>

      <Box gap={4}>
        {dots.map((value) => (
          <Box key={`right-${value}`} width={6} height={6} style={{ background: value === 1 ? '#3a7a1a' : '#5aaa2a' }} />
        ))}
      </Box>
    </Box>
  );
};
