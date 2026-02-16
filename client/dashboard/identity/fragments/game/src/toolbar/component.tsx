import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { Button } from '@ui/button';
import { useTranslations } from 'next-intl';

const buttons = ['BUTTON 1', 'BUTTON 2', 'BUTTON 3', 'BUTTON 4'];

export const ToolbarComponent = () => {
  const t = useTranslations('game.toolbar');
  return (
    <Box as='aside' width={180} flexDirection='column' gap={8}>
      <Box paddingBottom={6} borderBottom='2px solid #2a2a4a'>
        <Text
          as='div'
          color='$textMuted'
          font='$pixel'
          fontSize='0.5rem'
          letterSpacing='2px'
          textAlign='center'
        >
          {t('title')}
        </Text>
      </Box>
      <Box as='aside' flexDirection='column' gap={12}>
        {buttons.map((label) => (
          <Button
            key={label}
            fullWidth
            size='lg'
            variant='outline'
            radius='sm'
            font='$pixel'
            fontSize='0.8rem'
            textColor='$textGold'
            bg='$buttonBg'
            borderColor='$border'
            disabled
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};
