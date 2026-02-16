import { Box } from '@ui/layout';
import { Button } from '@ui/button';
import { Text } from '@ui/text';

const buttons = [
  { label: 'MAP', icon: '\u2302' },
  { label: 'QUEST', icon: '\u2694' },
  { label: 'ITEMS', icon: '\u2666' },
  { label: 'CHAT', icon: '\u270E' },
];

export const ToolbarComponent = () => {
  return (
    <Box as='aside' flexDirection='column' gap={6}>
      {buttons.map((button) => (
        <Button
          key={button.label}
          type='button'
          variant='outline'
          radius='sm'
          font='$eng'
          style={{
            width: 200,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: '#2a2a4a',
            background: 'linear-gradient(180deg, #1a1a34 0%, #14142a 100%)',
            color: '#8a8aaa',
            letterSpacing: '2px',
          }}
        >
          <Text as='span' style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '0.6rem', color: '#5aaa2a' }}>
            {button.icon}
          </Text>
          <Text
            as='span'
            style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '0.7rem', color: '#8a8aaa', letterSpacing: '2px' }}
          >
            {button.label}
          </Text>
        </Button>
      ))}
    </Box>
  );
};
