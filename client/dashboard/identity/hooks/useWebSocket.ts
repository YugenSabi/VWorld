import { useEffect, useMemo, useState } from 'react';
import { getWebSocketClient } from '../api/websocket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
}

export function useWebSocket(
  endpoint: string,
  options: UseWebSocketOptions = {}
) {
  const { autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);

  const client = useMemo(() => {
    return getWebSocketClient(endpoint);
  }, [endpoint]);

  useEffect(() => {
    if (autoConnect) {
      client.connect();
    }

    const unsubOpen = client.on('connection_open', () => {
      setIsConnected(true);
    });

    const unsubClose = client.on('connection_close', () => {
      setIsConnected(false);
    });

    const unsubError = client.on('connection_error', () => {
      setIsConnected(false);
    });

    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
    };
  }, [client, autoConnect]);

  return {
    isConnected,
    client,
  };
}

export function useWebSocketEvent<T = unknown>(
  endpoint: string,
  eventType: Parameters<ReturnType<typeof getWebSocketClient>['on']>[0],
  handler: (data: T) => void,
  enabled = true
) {
  const { client } = useWebSocket(endpoint, { autoConnect: enabled });

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = client.on<T>(eventType, handler);

    return () => {
      unsubscribe();
    };
  }, [client, eventType, handler, enabled]);
}
