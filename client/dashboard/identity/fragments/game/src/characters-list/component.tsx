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
    <Box as='aside' width={230} flexDirection='column' gap={8}>
      <Box paddingBottom={6} borderBottom='2px solid #2a2a4a'>
        <Text
          as='div'
          color='$textMuted'
          font='$pixel'
          fontSize='0.7rem'
          letterSpacing='2px'
          textAlign='center'
        >
          {t('title')}
        </Text>
      </Box>

      <Box flexDirection='column' gap={6}>
        {mockCharacters.map((character) => (
          <CharacterCardComponent key={character.name} name={character.name} mood={character.mood} />
        ))}
      </Box>
    </Box>
  );
};
