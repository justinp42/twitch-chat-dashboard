/**
 * Top Emotes Component
 *
 * Displays a list of the most frequently used emotes
 * in the current channel.
 */

interface TopEmotesProps {
  /** Array of [emote, count] tuples */
  emotes: [string, number][];
  /** Maximum emotes to display (default: 10) */
  maxDisplay?: number;
}

export function TopEmotes({
  emotes,
  maxDisplay = 10,
}: TopEmotesProps) {
  const displayEmotes = emotes.slice(0, maxDisplay);
  const maxCount = displayEmotes[0]?.[1] || 1;

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1f2937',
      borderRadius: '12px',
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        color: '#f3f4f6',
        fontSize: '16px',
        fontWeight: '500',
      }}>
        Top Emotes
      </h3>

      {displayEmotes.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
          No emotes detected yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayEmotes.map(([emote, count], index) => {
            const percentage = (count / maxCount) * 100;

            return (
              <div
                key={emote}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Rank */}
                <span style={{
                  color: '#6b7280',
                  fontSize: '12px',
                  width: '20px',
                  textAlign: 'right',
                }}>
                  #{index + 1}
                </span>

                {/* Emote name and bar */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <span style={{
                      color: '#f3f4f6',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                    }}>
                      {emote}
                    </span>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: '12px',
                    }}>
                      {count}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: '4px',
                    backgroundColor: '#374151',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: '#8b5cf6',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
