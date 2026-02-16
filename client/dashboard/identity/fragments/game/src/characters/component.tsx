import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { CharacterCardComponent } from './card';
import { useTranslations } from 'next-intl';

const mockCharacters = [
  { name: 'Danek', mood: 'Friendly' },
  { name: 'Sanek', mood: 'Friendly' },
  { name: 'Semen', mood: 'Angry' },
];

export const CharacterPanelComponent = () => {
  const t = useTranslations('game.characters');
  return (
    <Box as='aside' width={180} flexDirection='column' gap={8}>
      <Text
        as='div'
        color='$textMuted'
        font='$pixel'
        style={{
          fontSize: '0.5rem',
          letterSpacing: '2px',
          textAlign: 'center',
          paddingBottom: 6,
          borderBottom: '2px solid #2a2a4a',
        }}
      >
        {t('title')}
      </Text>

      <Box flexDirection='column' gap={6}>
        {mockCharacters.map((character) => (
          <CharacterCardComponent key={character.name} name={character.name} mood={character.mood} />
        ))}
      </Box>
    </Box>
  );
};
