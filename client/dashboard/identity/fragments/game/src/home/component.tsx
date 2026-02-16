import { Box } from '@ui/layout';
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
          borderColor='$borderBrown'
          style={{
            width: 'min(960px, 55vw)',
            border: '4px solid var(--ui-color-borderBrown, #2a1204)',
            boxShadow:
              'inset 0 0 0 2px var(--ui-color-borderBrownLight, #5a3a18), 0 0 60px rgba(90, 170, 42, 0.08), 0 0 120px rgba(0, 0, 0, 0.5)',
          }}
        >
          <HeaderComponent />
          <ViewportComponent />

          <Box
            as='footer'
            height={8}
            style={{
              background: 'linear-gradient(90deg, var(--ui-color-statusGreenDark, #2d4a1a) 0%, var(--ui-color-statusGreen, #3a6820) 25%, var(--ui-color-statusGreenDark, #2d4a1a) 50%, var(--ui-color-statusGreen, #3a6820) 75%, var(--ui-color-statusGreenDark, #2d4a1a) 100%)',
              borderTop: '2px solid var(--ui-color-statusBorder, #4a8a28)',
            }}
          />
        </Box>

        <CharacterPanelComponent />
      </Box>
    </Box>
  );
};
