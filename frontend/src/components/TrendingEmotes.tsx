/**
 * Trending Emotes Component
 *
 * Displays a list of the most used emotes with
 * counts and progress bars in the new design style.
 */

interface TrendingEmotesProps {
  emotes: [string, number][];
  maxDisplay?: number;
}

// Map common emote names to placeholder colors for visual variety
const emoteColors: Record<string, string> = {
  'LUL': '#f59e0b',
  'KEKW': '#10b981',
  'PogChamp': '#9146ff',
  'Kappa': '#00d4ff',
  'PeepoHappy': '#f97316',
  'OMEGALUL': '#ef4444',
  'monkaS': '#a970ff',
  'pepeLaugh': '#14b8a6',
  'Sadge': '#6b7280',
  'catJAM': '#ff007a',
};

export function TrendingEmotes({
  emotes,
  maxDisplay = 4,
}: TrendingEmotesProps) {
  const displayEmotes = emotes.slice(0, maxDisplay);
  const maxCount = displayEmotes[0]?.[1] || 1;

  // Format large numbers
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <span className="label">TRENDING EMOTES</span>
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
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </button>
      </div>

      {/* Emote list */}
      {displayEmotes.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 0',
          color: 'var(--text-muted)',
        }}>
          <span style={{ fontSize: '24px', marginBottom: '8px' }}>😶</span>
          <span style={{ fontSize: '14px' }}>No emotes detected yet</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {displayEmotes.map(([emote, count], index) => {
            const percentage = (count / maxCount) * 100;
            const color = emoteColors[emote] || 'var(--accent-purple)';
            const isTopEmote = index === 0;

            return (
              <div key={emote}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  {/* Emote placeholder/avatar */}
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: `${color}20`,
                    border: isTopEmote ? `1px solid ${color}50` : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: color,
                    boxShadow: isTopEmote ? `0 0 12px ${color}30` : 'none',
                    transition: 'all 0.2s ease',
                  }}>
                    {emote.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Emote name */}
                  <span style={{
                    flex: 1,
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                  }}>
                    {emote}
                    {isTopEmote && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '10px',
                        color: 'var(--accent-yellow)',
                      }}>👑</span>
                    )}
                  </span>

                  {/* Count */}
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: color,
                  }}>
                    {formatCount(count)}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: '5px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: '3px',
                  marginLeft: '50px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: isTopEmote
                      ? `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`
                      : color,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                    boxShadow: isTopEmote ? `0 0 8px ${color}50` : 'none',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
