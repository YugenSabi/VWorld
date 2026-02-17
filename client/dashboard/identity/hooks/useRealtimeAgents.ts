import { useCallback } from 'react';
import { useWebSocketEvent } from './useWebSocket';
import { WS_ENDPOINTS } from '../api/websocket';
import type { Agent } from '../schemas';

interface AgentsUpdateData {
  agents: Agent[];
}

interface AgentCreatedData {
  agent: Agent;
}

interface AgentDeletedData {
  agentId: number;
}

interface AgentMovedData {
  agentId: number;
  x: number;
  y: number;
}

interface AgentMoodChangedData {
  agentId: number;
  mood: string;
}

interface AgentThoughtData {
  agentId: number;
  thought: string;
}

interface AgentDialogueData {
  agentId1: number;
  name1: string;
  agentId2: number;
  name2: string;
  messages: { speaker: string; text: string }[];
}

interface UseRealtimeAgentsOptions {
  onAgentsUpdate?: (agents: Agent[]) => void;
  onAgentCreated?: (agent: Agent) => void;
  onAgentDeleted?: (agentId: number) => void;
  onAgentMoved?: (agentId: number, x: number, y: number) => void;
  onAgentMoodChanged?: (agentId: number, mood: string) => void;
  onAgentThought?: (agentId: number, thought: string) => void;
  onAgentDialogue?: (data: AgentDialogueData) => void;
  enabled?: boolean;
}

export function useRealtimeAgents(options: UseRealtimeAgentsOptions = {}) {
  const {
    onAgentsUpdate,
    onAgentCreated,
    onAgentDeleted,
    onAgentMoved,
    onAgentMoodChanged,
    onAgentThought,
    onAgentDialogue,
    enabled = true,
  } = options;

  const handleAgentsUpdate = useCallback(
    (data: AgentsUpdateData) => {
      if (onAgentsUpdate) {
        onAgentsUpdate(data.agents);
      }
    },
    [onAgentsUpdate]
  );

  const handleAgentCreated = useCallback(
    (data: AgentCreatedData) => {
      if (onAgentCreated) {
        onAgentCreated(data.agent);
      }
    },
    [onAgentCreated]
  );

  const handleAgentDeleted = useCallback(
    (data: AgentDeletedData) => {
      if (onAgentDeleted) {
        onAgentDeleted(data.agentId);
      }
    },
    [onAgentDeleted]
  );

  const handleAgentMoved = useCallback(
    (data: AgentMovedData) => {
      if (onAgentMoved) {
        onAgentMoved(data.agentId, data.x, data.y);
      }
    },
    [onAgentMoved]
  );

  const handleAgentMoodChanged = useCallback(
    (data: AgentMoodChangedData) => {
      if (onAgentMoodChanged) {
        onAgentMoodChanged(data.agentId, data.mood);
      }
    },
    [onAgentMoodChanged]
  );

  const handleAgentThought = useCallback(
    (data: AgentThoughtData) => {
      if (onAgentThought) {
        onAgentThought(data.agentId, data.thought);
      }
    },
    [onAgentThought]
  );

  const handleAgentDialogue = useCallback(
    (data: AgentDialogueData) => {
      if (onAgentDialogue) {
        onAgentDialogue(data);
      }
    },
    [onAgentDialogue]
  );

  useWebSocketEvent(WS_ENDPOINTS.agents, 'agents_update', handleAgentsUpdate, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_created', handleAgentCreated, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_deleted', handleAgentDeleted, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_moved', handleAgentMoved, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_mood_changed', handleAgentMoodChanged, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_thought', handleAgentThought, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_dialogue', handleAgentDialogue, enabled);
}
