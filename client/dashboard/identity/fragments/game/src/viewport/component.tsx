import Image from 'next/image';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import worldMap from '@shared/images/world.gif';

export const ViewportComponent = () => {
  return (
    <Box as='section' flexDirection='column'>
      <Box
        alignItems='center'
        justifyContent='space-between'
        style={{
          gap: 10,
          padding: '8px 14px',
          background: 'linear-gradient(180deg, #171b30 0%, #131728 100%)',
          borderBottom: '2px solid #2a1204',
          boxShadow: 'inset 0 -1px 0 #3a7a1a',
        }}
      >
        <Text
          as='p'
          style={{
            margin: 0,
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: '0.55rem',
            letterSpacing: '2px',
            color: '#ffe880',
            textShadow: '1px 1px 0 #2a1204',
          }}
        >
          WHISPERING VILLAGE
        </Text>

        <Box
          as='div'
          alignItems='center'
          style={{
            gap: 14,
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: '0.4rem',
            letterSpacing: '1px',
            color: '#7fd54a',
          }}
        >
          <Text as='span'>REGION: NORTH FRONTIER</Text>
          <Text as='span'>THREAT: LOW</Text>
        </Box>
      </Box>

      <Box
        as='div'
        position='relative'
        width='$full'
        style={{
          aspectRatio: '4 / 3',
          overflow: 'hidden',
          background: '#1a3a0e',
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Image
          src={worldMap}
          alt='VWorld village map'
          fill
          unoptimized
          draggable={false}
          style={{ objectFit: 'cover', imageRendering: 'pixelated' }}
        />
      </Box>
    </Box>
  );
};
