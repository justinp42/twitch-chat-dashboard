/**
 * TypeScript Type Definitions for Twitch Chat Dashboard
 *
 * These types mirror the backend Pydantic models to ensure
 * type safety across the full stack.
 */

/**
 * Real-time metrics for a channel
 * Received from WebSocket every second
 */
export interface ChannelMetrics {
  channel: string;
  timestamp: string;
  messages_per_second: number;
  messages_last_minute: number;
  unique_chatters_5min: number;
  top_emotes: [string, number][];
  avg_message_length: number;
}

/**
 * WebSocket message wrapper
 * All messages include a type field
 */
export interface WebSocketMessage {
  type: 'metrics' | 'error' | 'connected';
  [key: string]: unknown;
}

/**
 * Metrics message from WebSocket
 */
export interface MetricsMessage extends WebSocketMessage {
  type: 'metrics';
  channel: string;
  timestamp: string;
  messages_per_second: number;
  messages_last_minute: number;
  unique_chatters_5min: number;
  top_emotes: [string, number][];
  avg_message_length: number;
}

/**
 * Health check response from /api/health
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  twitch_connected: boolean;
  channels_count: number;
  channels: string[];
  buffer_stats: {
    total_messages: number;
    channels: Record<string, number>;
  };
  websocket_clients: number;
}

/**
 * Connection state for WebSocket
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Historical data point for charts
 */
export interface MetricsDataPoint {
  timestamp: Date;
  messagesPerSecond: number;
  messagesLastMinute: number;
  uniqueChatters: number;
}

/**
 * Hype event - detected chat velocity spike
 */
export interface HypeEvent {
  id?: number;
  channel: string;
  timestamp: string;
  velocity: number;
  baseline_mean: number;
  baseline_std: number;
  multiplier: number;
  top_emotes: [string, number][];
}

/**
 * Hype event WebSocket message
 */
export interface HypeEventMessage extends WebSocketMessage {
  type: 'hype_event';
  channel: string;
  timestamp: string;
  velocity: number;
  baseline_mean: number;
  baseline_std: number;
  multiplier: number;
  top_emotes: [string, number][];
}
