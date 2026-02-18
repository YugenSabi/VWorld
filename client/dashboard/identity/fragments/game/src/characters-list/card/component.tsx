import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import type { AgentMood } from '@/schemas';
import char1Idle from '@shared/characters/char_1/beadwork-cross-stitch-pixel-art-pattern-people-dance-d2d7111f4ce5dc01915ceb14d47243a8.png';
import char2Idle from '@shared/characters/char_2/—Pngtree—pixel beauty_4758536.png';
import char3Idle from '@shared/characters/char_3/—Pngtree—pixel art character young boy_7325574.png';
import mob1 from '@shared/mobs/mob_1/cat-minecraft-anime-manga-color-by-number-pixel-art-coloring-bead-husky-dog-f7401d42da5ac56d0bcfabdcae54f435.png';
import mob2 from '@shared/mobs/mob_2/pixel-art-drawing-pixelation-dog-dog-952116381da75340b19b023c73ef8bcd.png';
import mob3 from '@shared/mobs/mob_3/cat-kitten-pixel-art-cat-1aff464dfe4364a01019b92731bf5252.png';

interface CharacterCardProps {
  name: string;
  mood: AgentMood;
  type?: string;
  avatarUrl?: string;
  level?: number;
}

const MOOD_LABELS: Record<string, string> = {
  joy: 'Joy',
  anger: 'Anger',
  sadness: 'Sadness',
  fear: 'Fear',
  neutral: 'Neutral',
};

function formatMood(mood: string): string {
  const raw = (mood || '').trim();
  if (!raw.startsWith('{')) {
    return raw || 'neutral';
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    const entries = Object.entries(parsed).filter(([, value]) => typeof value === 'number');
    if (entries.length === 0) {
      return 'neutral';
    }
    entries.sort((a, b) => b[1] - a[1]);
    const [topKey, topValue] = entries[0];
    const label = MOOD_LABELS[topKey] || topKey;
    return `${label} ${Math.round(topValue)}%`;
  } catch {
    return raw;
  }
}

function resolveAvatar(name: string, type?: string): string {
  if ((type || 'agent') === 'mob') {
    const mobSprites = [
      (mob1 as { src: string }).src,
      (mob2 as { src: string }).src,
      (mob3 as { src: string }).src,
    ];
    return mobSprites[name.length % mobSprites.length];
  }
  const agentSprites = [
    (char1Idle as { src: string }).src,
    (char2Idle as { src: string }).src,
    (char3Idle as { src: string }).src,
  ];
  return agentSprites[name.length % agentSprites.length];
}

export const CharacterCardComponent = ({ name, mood, type, avatarUrl, level }: CharacterCardProps) => {
  const moodText = formatMood(mood);
  const finalAvatar = avatarUrl || resolveAvatar(name, type);
  return (
    <Box
      alignItems='center'
      gap={8}
      padding={8}
      backgroundColor='$panelBg'
      borderColor='$border'
      border='2px solid'
    >
      <Box
        width={42}
        height={42}
        flexShrink={0}
        backgroundColor='$border'
        borderColor='$borderLight'
        border='2px solid'
        overflow='hidden'
      >
        {finalAvatar ? (
          <img
            src={finalAvatar}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              imageRendering: 'pixelated',
            }}
          />
        ) : null}
      </Box>

      <Box flexDirection='column' gap={10} minWidth={0}>
        <Box alignItems='center' gap={6}>
          <Text as='span' color='$textGold' font='$pixel' fontSize='0.74rem' letterSpacing='0.5px'>
            {name}
          </Text>
          {level !== undefined && (
            <Text as='span' color='$textMuted' font='$pixel' fontSize='0.6rem'>
              Lv.{level}
            </Text>
          )}
        </Box>

        <Text as='span' color='$accentGreen' font='$pixel' fontSize='0.6rem' letterSpacing='0.2px'>
          {moodText}
        </Text>
      </Box>
    </Box>
  );
};
