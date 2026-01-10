/**
 * Hype Events Hook
 *
 * Manages hype event state and WebSocket subscription.
 * Provides:
 * - Real-time hype alerts via WebSocket
 * - Historical hype events via REST API
 * - Current alert state for UI display
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { HypeEvent, ConnectionState } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL?.replace('/ws/metrics', '/ws/hype') || 'ws://localhost:8000/ws/hype';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UseHypeEventsReturn {
  /** Most recent hype event (for alert display) */
  currentAlert: HypeEvent | null;
  /** All hype events history */
  events: HypeEvent[];
  /** WebSocket connection state */
  connectionState: ConnectionState;
  /** Dismiss the current alert */
  dismissAlert: () => void;
  /** Fetch historical events */
  refreshHistory: () => Promise<void>;
  /** Export events as CSV */
  exportCsv: (channel?: string) => void;
}

export function useHypeEvents(): UseHypeEventsReturn {
  const [currentAlert, setCurrentAlert] = useState<HypeEvent | null>(null);
  const [events, setEvents] = useState<HypeEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);

  // Auto-dismiss alert after 10 seconds
  const showAlert = useCallback((event: HypeEvent) => {
    setCurrentAlert(event);

    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    // Auto-dismiss after 10 seconds
    alertTimeoutRef.current = window.setTimeout(() => {
      setCurrentAlert(null);
    }, 10000);
  }, []);

  // Dismiss alert manually
  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  }, []);

  // Fetch historical events from API
  const refreshHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/hype-events?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('[HypeEvents] Failed to fetch history:', error);
    }
  }, []);

  // Export CSV
  const exportCsv = useCallback((channel?: string) => {
    const url = channel
      ? `${API_URL}/api/hype-events/export?channel=${encodeURIComponent(channel)}`
      : `${API_URL}/api/hype-events/export`;

    window.open(url, '_blank');
  }, []);

  // WebSocket connection
  useEffect(() => {
    const connect = () => {
      setConnectionState('connecting');

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[HypeEvents] WebSocket connected');
          setConnectionState('connected');
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;

          try {
            const message = JSON.parse(event.data);

            if (message.type === 'hype_event') {
              const hypeEvent: HypeEvent = {
                channel: message.channel,
                timestamp: message.timestamp,
                velocity: message.velocity,
                baseline_mean: message.baseline_mean,
                baseline_std: message.baseline_std,
                multiplier: message.multiplier,
                top_emotes: message.top_emotes || [],
              };

              // Show alert
              showAlert(hypeEvent);

              // Add to history (prepend)
              setEvents((prev) => [hypeEvent, ...prev].slice(0, 100));
            }
          } catch (e) {
            console.error('[HypeEvents] Failed to parse message:', e);
          }
        };

        ws.onerror = () => {
          setConnectionState('error');
        };

        ws.onclose = () => {
          setConnectionState('disconnected');
          wsRef.current = null;

          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      } catch (error) {
        console.error('[HypeEvents] WebSocket connection failed:', error);
        setConnectionState('error');
      }
    };

    connect();

    // Fetch initial history
    refreshHistory();

    // Cleanup
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [refreshHistory, showAlert]);

  // Ping to keep connection alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentAlert,
    events,
    connectionState,
    dismissAlert,
    refreshHistory,
    exportCsv,
  };
}
