/**
 * Connection Status Component
 *
 * Shows the current WebSocket connection state with
 * visual indicator and reconnect button.
 */

import type { ConnectionState } from '../types';

interface ConnectionStatusProps {
  state: ConnectionState;
  onReconnect: () => void;
}

const stateConfig: Record<ConnectionState, { color: string; label: string }> = {
  connecting: { color: '#f59e0b', label: 'Connecting...' },
  connected: { color: '#10b981', label: 'Connected' },
  disconnected: { color: '#6b7280', label: 'Disconnected' },
  error: { color: '#ef4444', label: 'Connection Error' },
};

export function ConnectionStatus({ state, onReconnect }: ConnectionStatusProps) {
  const config = stateConfig[state];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      backgroundColor: '#1f2937',
      borderRadius: '8px',
    }}>
      {/* Status indicator dot */}
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: config.color,
        boxShadow: `0 0 8px ${config.color}`,
      }} />

      {/* Status text */}
      <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
        {config.label}
      </span>

      {/* Reconnect button (shown when disconnected or error) */}
      {(state === 'disconnected' || state === 'error') && (
        <button
          onClick={onReconnect}
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
