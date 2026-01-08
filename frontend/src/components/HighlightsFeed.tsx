/**
 * Highlights Feed Component
 *
 * Shows a timeline of notable events:
 * - Hype moments
 * - Raids
 * - Sub goals
 * - Stream events
 */

interface Highlight {
  id: string;
  type: 'hype' | 'raid' | 'sub' | 'event';
  title: string;
  description: string;
  timestamp: Date;
  isLive?: boolean;
}

interface HighlightsFeedProps {
  highlights: Highlight[];
  onViewHistory?: () => void;
}

const typeConfig: Record<string, { color: string; icon: string; glow: string }> = {
  hype: { color: '#ff007a', icon: '🔥', glow: 'rgba(255, 0, 122, 0.3)' },
  raid: { color: '#00d4ff', icon: '⚔️', glow: 'rgba(0, 212, 255, 0.3)' },
  sub: { color: '#00f593', icon: '⭐', glow: 'rgba(0, 245, 147, 0.3)' },
  event: { color: '#9146ff', icon: '📡', glow: 'rgba(145, 70, 255, 0.3)' },
};

export function HighlightsFeed({
  highlights,
  onViewHistory,
}: HighlightsFeedProps) {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Sample highlights if none provided
  const displayHighlights = highlights.length > 0 ? highlights : [
    {
      id: '1',
      type: 'event' as const,
      title: 'Stream Started',
      description: 'Just Chatting Category',
      timestamp: new Date(Date.now() - 3600000),
      isLive: false,
    },
  ];

  return (
    <div className="card" style={{ padding: '20px', flex: 1 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <span className="label">HIGHLIGHTS FEED</span>
        <button style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-elevated)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted)">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
        </button>
      </div>

      {/* Highlights list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayHighlights.map((highlight) => {
          const config = typeConfig[highlight.type];

          return (
            <div
              key={highlight.id}
              style={{
                display: 'flex',
                gap: '12px',
              }}
            >
              {/* Icon */}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: `${config.color}20`,
                border: `1px solid ${config.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: highlight.isLive ? `0 0 12px ${config.glow}` : 'none',
              }}>
                <span style={{ fontSize: '16px' }}>
                  {config.icon}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '3px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                    }}>
                      {highlight.title}
                    </span>
                    {highlight.isLive && (
                      <span className="pulse-alert" style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: 'var(--accent-red)',
                        padding: '3px 8px',
                        backgroundColor: 'rgba(235, 4, 0, 0.15)',
                        border: '1px solid rgba(235, 4, 0, 0.3)',
                        borderRadius: '6px',
                        letterSpacing: '0.05em',
                      }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: highlight.isLive ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontWeight: highlight.isLive ? '600' : '400',
                  }}>
                    {highlight.isLive ? 'NOW' : formatTime(highlight.timestamp)}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {highlight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* View history button */}
      <button
        onClick={onViewHistory}
        style={{
          width: '100%',
          marginTop: '20px',
          padding: '12px',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.05em',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-purple)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        VIEW FULL HISTORY
      </button>
    </div>
  );
}
