export type WebSocketEventType =
  | 'connection_open'
  | 'connection_close'
  | 'connection_error'
  | 'agents_update'
  | 'agent_created'
  | 'agent_deleted'
  | 'agent_moved'
  | 'agent_mood_changed'
  | 'agent_thought'
  | 'agent_dialogue'
  | 'environment_update'
  | 'weather_changed'
  | 'time_updated'
  | 'event_created'
  | 'relationship_update'
  | 'memory_created';


interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  data: T;
  timestamp?: string;
}

type EventHandler<T = unknown> = (data: T) => void;

interface WebSocketClientConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<WebSocketEventType, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(private config: WebSocketClientConfig) {
    this.config.reconnectInterval = config.reconnectInterval ?? 3000;
    this.config.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.warn('[WS] Already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      console.log('[WS] Connected to', this.config.url);
      this.reconnectAttempts = 0;
      this.handleMessage({ type: 'connection_open', data: null });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
      this.handleMessage({ type: 'connection_error', data: null });
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.handleMessage({ type: 'connection_close', data: null });
      this.ws = null;

      if (!this.isIntentionallyClosed) {
        this.attemptReconnect();
      }
    };
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on<T = unknown>(eventType: WebSocketEventType, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler as EventHandler);
      }
    };
  }

  send<T = unknown>(type: string, data?: T): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage<T> = { type: type as WebSocketEventType, data: data as T };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('[WS] Cannot send message - not connected');
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`[WS] Error in handler for ${message.type}:`, error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

const wsClients: Map<string, WebSocketClient> = new Map();

export const getWebSocketClient = (endpoint: string): WebSocketClient => {
  if (!wsClients.has(endpoint)) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const fullUrl = `${wsUrl}${endpoint}`;
    wsClients.set(endpoint, new WebSocketClient({ url: fullUrl }));
  }
  return wsClients.get(endpoint)!;
};

export const connectWebSocket = (endpoint: string): void => {
  getWebSocketClient(endpoint).connect();
};

export const disconnectWebSocket = (endpoint: string): void => {
  const client = wsClients.get(endpoint);
  if (client) {
    client.disconnect();
    wsClients.delete(endpoint);
  }
};

export const disconnectAllWebSockets = (): void => {
  wsClients.forEach(client => client.disconnect());
  wsClients.clear();
};
