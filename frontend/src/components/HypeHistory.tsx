/**
 * Hype History Component
 *
 * Scrollable list of past hype events.
 * Features:
 * - Sorted by recency (newest first)
 * - Visual intensity bar based on multiplier
 * - Timestamp and velocity display
 * - Export to CSV button
 */

import type { HypeEvent } from '../types';

interface HypeHistoryProps {
  events: HypeEvent[];
  onExport: () => void;
  maxDisplay?: number;
}

export function HypeHistory({ events, onExport, maxDisplay = 10 }: HypeHistoryProps) {
  const displayEvents = events.slice(0, maxDisplay);

  // Format relative time
  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Get intensity color based on multiplier
  const getIntensityColor = (multiplier: number): string => {
    if (multiplier >= 5) return 'var(--accent-red)';
    if (multiplier >= 3) return 'var(--accent-magenta)';
    return 'var(--accent-purple)';
  };

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '200px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <div className="label" style={{ marginBottom: '4px' }}>
            HYPE HISTORY
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {events.length} events detected
          </div>
        </div>

        <button
          onClick={onExport}
          className="btn"
          style={{
            fontSize: '11px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          Export
        </button>
      </div>

      {/* Events list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {displayEvents.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text-muted)">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              No hype events yet
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Hype moments will appear here when detected
            </div>
          </div>
        ) : (
          displayEvents.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'transform 0.2s, background 0.2s',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(145, 70, 255, 0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Intensity indicator */}
              <div
                style={{
                  width: '4px',
                  height: '36px',
                  borderRadius: '2px',
                  background: getIntensityColor(event.multiplier),
                  boxShadow: `0 0 8px ${getIntensityColor(event.multiplier)}`,
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {event.velocity.toFixed(1)} msg/s
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: getIntensityColor(event.multiplier),
                      background: `${getIntensityColor(event.multiplier)}20`,
                      padding: '2px 6px',
                      borderRadius: '6px',
                    }}
                  >
                    {event.multiplier.toFixed(1)}x
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span>{event.channel}</span>
                  <span>·</span>
                  <span>{formatTimeAgo(event.timestamp)}</span>
                </div>
              </div>

              {/* Arrow */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="var(--text-muted)"
                style={{ opacity: 0.5 }}
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </div>
          ))
        )}
      </div>

      {/* View more link */}
      {events.length > maxDisplay && (
        <div
          style={{
            marginTop: '12px',
            textAlign: 'center',
          }}
        >
          <button
            className="btn"
            style={{
              fontSize: '12px',
              padding: '8px 16px',
              width: '100%',
            }}
          >
            View all {events.length} events
          </button>
        </div>
      )}
    </div>
  );
}
