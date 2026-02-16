import { Box } from '@ui/layout';
import { Button } from '@ui/button';
import { Text } from '@ui/text';
import { CharacterCardComponent } from './card';

const mockCharacters = [
  { name: 'Danek', mood: 'Friendly' },
  { name: 'Sanek', mood: 'Friendly' },
  { name: 'Semen', mood: 'Angry' },
];

export const CharacterPanelComponent = () => {
  return (
    <Box as='aside' width={190} flexDirection='column' gap={8}>
      <Box as='h2' alignItems='center' justifyContent='center' gap={6} style={{ margin: 0, paddingBottom: 8, borderBottom: '2px solid #2a2a4a' }}>
        <Text as='span' style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '0.4rem', color: '#5aaa2a' }}>
          {'\u2726'}
        </Text>
        <Text
          as='span'
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: '0.5rem',
            color: '#8a8aaa',
            letterSpacing: '2px',
          }}
        >
          CHARACTERS
        </Text>
        <Text as='span' style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: '0.4rem', color: '#5aaa2a' }}>
          {'\u2726'}
        </Text>
      </Box>

      <Box flexDirection='column' gap={6}>
        {mockCharacters.map((character) => (
          <CharacterCardComponent key={character.name} name={character.name} mood={character.mood} />
        ))}
      </Box>

      <Button
        type='button'
        variant='ghost'
        radius='sm'
        font='$eng'
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '10px',
          border: '2px dashed #2a2a4a',
          color: '#4a4a6a',
          fontSize: '0.5rem',
          letterSpacing: '1px',
        }}
      >
        + ADD
      </Button>
    </Box>
  );
};
