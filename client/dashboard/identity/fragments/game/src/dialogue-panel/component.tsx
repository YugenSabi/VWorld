'use client';

import { useCallback, useState } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { useRealtimeAgents } from '@/hooks';
import { USE_MOCK_AGENTS } from '@/mocks';

type DialogueEntry = {
  id: string;
  speaker: string;
  text: string;
  target?: string;
};

const MAX_ITEMS = 10;

function normalizeDialogueText(raw: string): string {
  const text = (raw || '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
  if (!text) {
    return '';
  }
  const lower = text.toLowerCase();
  const blockedPrefixes = [
    '\u0446\u0435\u043b\u044c:',
    '\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435:',
    '\u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435:',
    'goal:',
    'action:',
    'mood:',
  ];
  if (blockedPrefixes.some((prefix) => lower.startsWith(prefix))) {
    return '';
  }
  if (/[.!?]$/.test(text)) {
    return text;
  }
  return `${text}.`;
}

export const DialoguePanelComponent = () => {
  const [entries, setEntries] = useState<DialogueEntry[]>([]);

  const pushEntry = useCallback((entry: DialogueEntry) => {
    setEntries((prev) => [entry, ...prev].slice(0, MAX_ITEMS));
  }, []);

  useRealtimeAgents({
    onAgentDialogue: (data) => {
      if (data.messages.length > 0) {
        const first = normalizeDialogueText(data.messages[0].text);
        if (first) {
          pushEntry({
            id: `${Date.now()}-${data.agentId1}-dialogue-a`,
            speaker: data.name1,
            target: data.name2,
            text: first,
          });
        }
      }
      if (data.messages.length > 1) {
        const second = normalizeDialogueText(data.messages[1].text);
        if (second) {
          pushEntry({
            id: `${Date.now()}-${data.agentId2}-dialogue-b`,
            speaker: data.name2,
            target: data.name1,
            text: second,
          });
        }
      }
    },
    enabled: !USE_MOCK_AGENTS,
  });

  return (
    <Box
      flexDirection='column'
      gap={8}
      padding='12px 14px'
      background='linear-gradient(180deg, rgba(10, 16, 32, 0.94) 0%, rgba(8, 12, 24, 0.94) 100%)'
      border='2px solid #2e3f66'
      boxShadow='0 12px 28px rgba(0, 0, 0, 0.45)'
      minHeight={150}
      maxHeight={190}
      overflow='hidden'
    >
      <Box alignItems='center' justifyContent='space-between'>
        <Text as='span' color='$textGold' font='$pixel' fontSize='0.68rem' letterSpacing='1px'>
          LIVE DIALOGUES
        </Text>
        <Text as='span' color='$textMuted' font='$pixel' fontSize='0.5rem'>
          {entries.length} lines
        </Text>
      </Box>

      <Box className='dialogue-feed-scroll' flexDirection='column' gap={8} overflow='auto' flexGrow={1} paddingRight={2}>
        {entries.length === 0 && (
          <Text as='div' color='$textMuted' font='$pixel' fontSize='0.56rem'>
            Dialogues will appear after agents react and talk.
          </Text>
        )}

        {entries.map((entry) => (
          <Box
            key={entry.id}
            alignItems='center'
            gap={8}
            padding='7px 9px'
            background='rgba(18, 30, 50, 0.76)'
            border='1px solid rgba(55, 80, 126, 0.85)'
          >
            <Box
              width={22}
              height={22}
              borderRadius='999px'
              alignItems='center'
              justifyContent='center'
              background='linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)'
              flexShrink={0}
            >
              <Text as='span' color='#fff' font='$pixel' fontSize='0.5rem'>
                {entry.speaker.slice(0, 1).toUpperCase()}
              </Text>
            </Box>
            <Box flexDirection='column' gap={2}>
              <Text as='span' color='$textGold' font='$pixel' fontSize='0.56rem'>
                {entry.target ? `${entry.speaker} -> ${entry.target}` : entry.speaker}
              </Text>
              <Text
                as='span'
                color='$textMuted'
                font='$pixel'
                fontSize='0.54rem'
                style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {entry.text}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
