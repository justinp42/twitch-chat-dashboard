/**
 * Metrics State Management Hook
 *
 * This hook combines WebSocket connection with metrics state.
 * It maintains:
 * - Current metrics for each channel
 * - Historical data for charts (last 60 data points)
 * - Connection state
 *
 * The hook automatically subscribes to the backend WebSocket
 * and updates state as metrics arrive.
 */

import { useState, useCallback, useMemo } from 'react';
import { useWebSocket } from './useWebSocket';
import type { ConnectionState, MetricsMessage, MetricsDataPoint, ChannelMetrics } from '../types';

/** How many data points to keep for charts */
const HISTORY_LENGTH = 60;

/** WebSocket URL - uses environment variable or defaults to localhost */
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/metrics';

interface UseMetricsReturn {
  /** Current metrics (most recent) */
  currentMetrics: ChannelMetrics | null;
  /** Historical data for charts */
  history: MetricsDataPoint[];
  /** WebSocket connection state */
  connectionState: ConnectionState;
  /** Reconnect to WebSocket */
  reconnect: () => void;
  /** All channels being monitored */
  channels: string[];
  /** Currently selected channel */
  selectedChannel: string | null;
  /** Change selected channel */
  selectChannel: (channel: string) => void;
}

export function useMetrics(): UseMetricsReturn {
  // Current metrics per channel
  const [metricsMap, setMetricsMap] = useState<Record<string, ChannelMetrics>>({});

  // Historical data per channel (for charts)
  const [historyMap, setHistoryMap] = useState<Record<string, MetricsDataPoint[]>>({});

  // Currently selected channel
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Handle incoming metrics
  const handleMetrics = useCallback((message: MetricsMessage) => {
    const channel = message.channel;

    // Update current metrics
    const metrics: ChannelMetrics = {
      channel: message.channel,
      timestamp: message.timestamp,
      messages_per_second: message.messages_per_second,
      messages_last_minute: message.messages_last_minute,
      unique_chatters_5min: message.unique_chatters_5min,
      top_emotes: message.top_emotes,
      avg_message_length: message.avg_message_length,
    };

    setMetricsMap(prev => ({
      ...prev,
      [channel]: metrics,
    }));

    // Auto-select first channel if none selected
    setSelectedChannel(prev => prev || channel);

    // Add to history
    const dataPoint: MetricsDataPoint = {
      timestamp: new Date(message.timestamp),
      messagesPerSecond: message.messages_per_second,
      messagesLastMinute: message.messages_last_minute,
      uniqueChatters: message.unique_chatters_5min,
    };

    setHistoryMap(prev => {
      const channelHistory = prev[channel] || [];
      const newHistory = [...channelHistory, dataPoint];

      // Keep only last HISTORY_LENGTH points
      if (newHistory.length > HISTORY_LENGTH) {
        newHistory.shift();
      }

      return {
        ...prev,
        [channel]: newHistory,
      };
    });
  }, []);

  // WebSocket connection
  const { connectionState, reconnect } = useWebSocket({
    url: WS_URL,
    onMetrics: handleMetrics,
    onConnectionChange: (state) => {
      console.log('[Metrics] Connection state:', state);
    },
  });

  // Get list of all channels
  const channels = useMemo(() => Object.keys(metricsMap), [metricsMap]);

  // Get current metrics for selected channel
  const currentMetrics = useMemo(() => {
    if (!selectedChannel) return null;
    return metricsMap[selectedChannel] || null;
  }, [metricsMap, selectedChannel]);

  // Get history for selected channel
  const history = useMemo(() => {
    if (!selectedChannel) return [];
    return historyMap[selectedChannel] || [];
  }, [historyMap, selectedChannel]);

  // Select a channel
  const selectChannel = useCallback((channel: string) => {
    setSelectedChannel(channel);
  }, []);

  return {
    currentMetrics,
    history,
    connectionState,
    reconnect,
    channels,
    selectedChannel,
    selectChannel,
  };
}
