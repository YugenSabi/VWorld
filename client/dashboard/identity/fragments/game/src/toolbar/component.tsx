import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { useTranslations } from 'next-intl';

const buttons = ['BUTTON 1', 'BUTTON 2', 'BUTTON 3', 'BUTTON 4'];

export const ToolbarComponent = () => {
  const t = useTranslations('game.toolbar');
  return (
    <Box as='aside' flexDirection='column' gap={6}>
      {buttons.map((label) => (
        <Box
          key={label}
          width={200}
          height={50}
          alignItems='center'
          justifyContent='center'
          backgroundColor='$buttonBg'
          borderColor='$border'
          border='2px solid'
          style={{
            cursor: 'default',
            opacity: 0.4,
          }}
        >
          <Text
            as='span'
            color='$accentGreenBright'
            font='$pixel'
            style={{
              fontSize: '0.8rem',
              letterSpacing: '1px',
            }}
          >
            {label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};
