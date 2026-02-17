'use client';

import { useState, useEffect, useCallback } from 'react';
import { agentsService } from '../api';
import type { Agent, GetAgentsParams } from '../schemas';

interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

interface UseAgentsState {
  agents: Agent[];
  isLoading: boolean;
  error: ApiError | null;
  total: number;
}

interface UseAgentsReturn extends UseAgentsState {
  refetch: () => Promise<void>;
}

export function useAgents(
  params?: GetAgentsParams,
  options: { autoFetch?: boolean } = { autoFetch: true },
): UseAgentsReturn {
  const [state, setState] = useState<UseAgentsState>({
    agents: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const fetchAgents = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await agentsService.getAgents(params);
      setState({
        agents: response.agents,
        total: response.total,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error: ApiError = {
        message: err instanceof Error ? err.message : 'Failed to fetch agents',
        statusCode: (err as any).statusCode,
        code: (err as any).code,
      };

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
    }
  }, []);

  useEffect(() => {
    if (options.autoFetch) {
      fetchAgents();
    }
  }, []);

  return {
    ...state,
    refetch: fetchAgents,
  };
}

export function useAgentById(agentId: string | null): {
  agent: Agent | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<{
    agent: Agent | null;
    isLoading: boolean;
    error: ApiError | null;
  }>({
    agent: null,
    isLoading: false,
    error: null,
  });

  const fetchAgent = useCallback(async () => {
    if (!agentId) {
      setState({ agent: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await agentsService.getAgentById(agentId);
      setState({
        agent: response.agent,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error: ApiError = {
        message: err instanceof Error ? err.message : 'Failed to fetch agent',
        statusCode: (err as any).statusCode,
        code: (err as any).code,
      };

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  return {
    ...state,
    refetch: fetchAgent,
  };
}
