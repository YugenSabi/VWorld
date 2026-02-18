export const WS_ENDPOINTS = {
  agents: '/ws/agents',
  points: '/ws/points',
  environment: '/ws/environment',
  events: '/ws/events',
} as const;

export type WSEndpoint = typeof WS_ENDPOINTS[keyof typeof WS_ENDPOINTS];
