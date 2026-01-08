/**
 * WebSocket Hook for Real-Time Metrics
 *
 * This hook manages the WebSocket connection to the backend.
 * It handles:
 * - Connection establishment and reconnection
 * - Ping/pong heartbeat for connection health
 * - Message parsing and dispatching
 * - Automatic cleanup on unmount
 *
 * Why a custom hook instead of a library?
 * - Our protocol is simple (just metrics messages)
 * - We need specific reconnection logic
 * - Reduces dependencies
 *
 * Important: Uses refs for callbacks to prevent reconnection loops
 * when parent components re-render with new callback references.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ConnectionState, MetricsMessage } from '../types';

interface UseWebSocketOptions {
  /** URL of the WebSocket endpoint */
  url: string;
  /** Callback when metrics are received */
  onMetrics?: (metrics: MetricsMessage) => void;
  /** Callback when connection state changes */
  onConnectionChange?: (state: ConnectionState) => void;
  /** Reconnection delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Ping interval in ms (default: 30000) */
  pingInterval?: number;
}

interface UseWebSocketReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Manually reconnect */
  reconnect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

export function useWebSocket({
  url,
  onMetrics,
  onConnectionChange,
  reconnectDelay = 3000,
  pingInterval = 30000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  // Store callbacks in refs to avoid reconnection on callback change
  const onMetricsRef = useRef(onMetrics);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Update refs when callbacks change
  useEffect(() => {
    onMetricsRef.current = onMetrics;
  }, [onMetrics]);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  // Update connection state and notify
  const updateConnectionState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    onConnectionChangeRef.current?.(state);
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Start ping/pong heartbeat
  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, pingInterval);
  }, [pingInterval]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    clearTimers();
    updateConnectionState('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to', url);
        updateConnectionState('connected');
        startPing();
      };

      ws.onmessage = (event) => {
        const data = event.data;

        // Handle pong response
        if (data === 'pong') {
          return;
        }

        // Parse JSON messages
        try {
          const message = JSON.parse(data);

          if (message.type === 'metrics' && onMetricsRef.current) {
            onMetricsRef.current(message as MetricsMessage);
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        updateConnectionState('error');
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Closed:', event.code, event.reason);
        clearTimers();
        updateConnectionState('disconnected');

        // Attempt to reconnect if we should
        if (shouldReconnectRef.current) {
          console.log(`[WebSocket] Reconnecting in ${reconnectDelay}ms...`);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      updateConnectionState('error');
    }
  }, [url, updateConnectionState, clearTimers, startPing, reconnectDelay]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearTimers();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateConnectionState('disconnected');
  }, [clearTimers, updateConnectionState]);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    disconnect();

    // Small delay before reconnecting
    setTimeout(() => {
      shouldReconnectRef.current = true;
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Connect on mount, disconnect on unmount
  // Only depends on url - callback changes won't cause reconnection
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connectionState,
    reconnect,
    disconnect,
  };
}
