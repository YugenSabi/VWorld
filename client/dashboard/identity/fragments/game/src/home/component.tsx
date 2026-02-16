import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { HeaderComponent } from './header/component';
import { ViewportComponent } from '../viewport';
import { ToolbarComponent } from '../toolbar';
import { CharacterPanelComponent } from '../characters';

export const HomeComponent = () => {
  return (
    <Box as='section' width='$full' minHeight='100dvh' alignItems='center' justifyContent='center' overflow='hidden'>
      <Box alignItems='flex-start' gap={16}>
        <ToolbarComponent />

        <Box
          as='main'
          flexDirection='column'
          style={{
            width: 'min(960px, 55vw)',
            border: '4px solid #2a1204',
            boxShadow:
              'inset 0 0 0 2px #5a3a18, 0 0 40px rgba(90, 170, 42, 0.1), 0 0 80px rgba(90, 170, 42, 0.05), 0 0 120px rgba(0, 0, 0, 0.6)',
          }}
        >
          <HeaderComponent />
          <ViewportComponent />

          <Box
            as='footer'
            alignItems='center'
            justifyContent='space-between'
            style={{
              padding: '4px 12px',
              background: 'linear-gradient(90deg, #1a2a10 0%, #1e3014 50%, #1a2a10 100%)',
              borderTop: '2px solid #3a6820',
            }}
          >
            <Text
              as='span'
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: '0.35rem',
                color: '#5aaa2a',
                letterSpacing: '1px',
              }}
            >
              {'\u2726'} Day 1 {'\u2014'} Sunny {'\u2726'} Village Square
            </Text>

            <Text
              as='span'
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: '0.35rem',
                color: '#3a7a1a',
                letterSpacing: '0.5px',
              }}
            >
              X:42 Y:17
            </Text>
          </Box>
        </Box>

        <CharacterPanelComponent />
      </Box>
    </Box>
  );
};
