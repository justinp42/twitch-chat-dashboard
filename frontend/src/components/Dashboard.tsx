/**
 * Main Dashboard Component
 *
 * Twitch Intel Dashboard with dark theme:
 * - Header with logo, hype alert, channel selector
 * - Live velocity and active chatters cards
 * - Trending emotes sidebar
 * - Velocity trend chart with area fill
 * - Highlights feed
 */

import { useState, useEffect, useRef } from 'react';
import { useMetrics } from '../hooks';
import { Header } from './Header';
import { LiveVelocityCard } from './LiveVelocityCard';
import { ActiveChattersCard } from './ActiveChattersCard';
import { TrendingEmotes } from './TrendingEmotes';
import { VelocityTrendChart } from './VelocityTrendChart';
import { HighlightsFeed } from './HighlightsFeed';

export function Dashboard() {
  const {
    currentMetrics,
    history,
    connectionState,
    reconnect,
    channels,
    selectedChannel,
    selectChannel,
  } = useMetrics();

  // Track previous velocity for percentage change
  const lastUpdateRef = useRef(Date.now());
  const [previousVelocity, setPreviousVelocity] = useState(0);
  const [peakVelocity, setPeakVelocity] = useState(50);

  // Track peak velocity and previous velocity
  useEffect(() => {
    if (currentMetrics) {
      const now = Date.now();
      // Update previous velocity every 5 seconds
      if (now - lastUpdateRef.current > 5000) {
        setPreviousVelocity(currentMetrics.messages_per_second);
        lastUpdateRef.current = now;
      }

      // Track peak
      if (currentMetrics.messages_per_second > peakVelocity) {
        setPeakVelocity(currentMetrics.messages_per_second);
      }
    }
  }, [currentMetrics, peakVelocity]);

  // Placeholder highlights (will be populated from Phase 3 hype detection)
  const highlights = [
    {
      id: '1',
      type: 'event' as const,
      title: 'Monitoring Started',
      description: `Watching ${selectedChannel || 'channel'}`,
      timestamp: new Date(),
      isLive: true,
    },
  ];

  // Hype alert state (will be controlled by Phase 3)
  const hypeAlert = {
    message: 'High Chat Activity',
    active: currentMetrics ? currentMetrics.messages_per_second > peakVelocity * 0.8 : false,
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(145, 70, 255, 0.08) 0%, transparent 50%)',
    }}>
      {/* Header */}
      <Header
        channels={channels}
        selectedChannel={selectedChannel}
        onChannelChange={selectChannel}
        connectionState={connectionState}
        hypeAlert={hypeAlert}
      />

      {/* Main content */}
      <main style={{
        padding: '24px 32px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {!currentMetrics ? (
          /* Loading state */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            gap: '20px',
          }}>
            {/* Animated Twitch-style loader */}
            <div style={{
              position: 'relative',
              width: '60px',
              height: '60px',
            }}>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                border: '3px solid var(--bg-elevated)',
                borderTopColor: 'var(--accent-purple)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-purple-dark) 100%)',
                borderRadius: '4px',
                boxShadow: '0 0 12px var(--accent-purple-glow)',
              }} />
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              {connectionState === 'connected'
                ? 'Waiting for chat data...'
                : connectionState === 'connecting'
                ? 'Connecting to server...'
                : 'Connection lost'}
            </p>
            {connectionState === 'error' && (
              <button
                onClick={reconnect}
                className="btn btn-primary"
                style={{
                  boxShadow: '0 0 16px var(--accent-purple-glow)',
                }}
              >
                Retry Connection
              </button>
            )}

            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          /* Dashboard grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 320px',
            gridTemplateRows: 'auto auto',
            gap: '24px',
          }}>
            {/* Row 1: Live Velocity Card */}
            <LiveVelocityCard
              velocity={currentMetrics.messages_per_second}
              previousVelocity={previousVelocity}
              peakVelocity={peakVelocity}
            />

            {/* Row 1: Active Chatters Card */}
            <ActiveChattersCard
              uniqueChatters={currentMetrics.unique_chatters_5min}
            />

            {/* Row 1-2: Trending Emotes (spans 2 rows) */}
            <div style={{ gridRow: 'span 2' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
                <TrendingEmotes
                  emotes={currentMetrics.top_emotes}
                  maxDisplay={4}
                />
                <HighlightsFeed
                  highlights={highlights}
                  onViewHistory={() => console.log('View history')}
                />
              </div>
            </div>

            {/* Row 2: Velocity Trend Chart (spans 2 columns) */}
            <div style={{ gridColumn: 'span 2' }}>
              <VelocityTrendChart
                data={history}
                hypePoints={[]}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
