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
  agentId: string;
}

interface AgentMovedData {
  agentId: string;
  x: number;
  y: number;
}

interface AgentMoodChangedData {
  agentId: string;
  mood: string;
}

interface UseRealtimeAgentsOptions {
  onAgentsUpdate?: (agents: Agent[]) => void;
  onAgentCreated?: (agent: Agent) => void;
  onAgentDeleted?: (agentId: string) => void;
  onAgentMoved?: (agentId: string, x: number, y: number) => void;
  onAgentMoodChanged?: (agentId: string, mood: string) => void;
  enabled?: boolean;
}

export function useRealtimeAgents(options: UseRealtimeAgentsOptions = {}) {
  const {
    onAgentsUpdate,
    onAgentCreated,
    onAgentDeleted,
    onAgentMoved,
    onAgentMoodChanged,
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

  useWebSocketEvent(WS_ENDPOINTS.agents, 'agents_update', handleAgentsUpdate, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_created', handleAgentCreated, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_deleted', handleAgentDeleted, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_moved', handleAgentMoved, enabled);
  useWebSocketEvent(WS_ENDPOINTS.agents, 'agent_mood_changed', handleAgentMoodChanged, enabled);
}
