/**
 * Channel Management Hook
 *
 * Provides functions to add and remove Twitch channels
 * via the backend REST API.
 */

import { useState, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UseChannelsReturn {
  /** List of monitored channels */
  channels: string[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Add a new channel */
  addChannel: (channel: string) => Promise<boolean>;
  /** Remove a channel */
  removeChannel: (channel: string) => Promise<boolean>;
  /** Refresh channel list */
  refresh: () => Promise<void>;
}

export function useChannels(): UseChannelsReturn {
  const [channels, setChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch channels from backend
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/channels`);
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(data.channels || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    }
  }, []);

  // Add a channel
  const addChannel = useCallback(async (channel: string): Promise<boolean> => {
    const channelName = channel.trim().toLowerCase();
    if (!channelName) {
      setError('Channel name cannot be empty');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channelName }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to add channel');
      }

      const data = await response.json();
      setChannels(data.channels || []);
      return true;
    } catch (err) {
      console.error('Failed to add channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to add channel');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove a channel
  const removeChannel = useCallback(async (channel: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/channels/${channel}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to remove channel');
      }

      const data = await response.json();
      setChannels(data.channels || []);
      return true;
    } catch (err) {
      console.error('Failed to remove channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove channel');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch channels on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    channels,
    loading,
    error,
    addChannel,
    removeChannel,
    refresh,
  };
}
