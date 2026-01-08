/**
 * Active Chatters Card
 *
 * Displays unique chatters count with a breakdown
 * visualization (subscribers vs guests).
 */

interface ActiveChattersCardProps {
  uniqueChatters: number;
  subscriberPercent?: number;
}

export function ActiveChattersCard({
  uniqueChatters,
  subscriberPercent = 65,
}: ActiveChattersCardProps) {
  const guestPercent = 100 - subscriberPercent;

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const isHighActivity = uniqueChatters > 50;

  return (
    <div className="card" style={{
      padding: '24px',
      background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(0, 245, 147, 0.03) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle glow overlay */}
      {isHighActivity && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(0, 245, 147, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div className="label" style={{ marginBottom: '16px', position: 'relative' }}>
        ACTIVE CHATTERS
      </div>

      {/* Main content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        {/* Value */}
        <span className="value-xl" style={{
          textShadow: isHighActivity ? '0 0 20px rgba(0, 245, 147, 0.3)' : 'none',
        }}>
          {formatNumber(uniqueChatters)}
        </span>

        {/* People icons - more visible */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '5px',
        }}>
          {[0.7, 0.85, 1, 0.85, 0.7].map((scale, i) => (
            <svg
              key={i}
              width={22 * scale}
              height={38 * scale}
              viewBox="0 0 20 36"
              fill={i === 2 ? 'var(--accent-cyan)' : 'var(--text-muted)'}
              style={{
                opacity: i === 2 ? 1 : 0.5,
                filter: i === 2 ? 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.4))' : 'none',
              }}
            >
              <circle cx="10" cy="8" r="6" />
              <path d="M10 16c-6 0-10 4-10 8v4c0 2 1 4 4 4h12c3 0 4-2 4-4v-4c0-4-4-8-10-8z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: '20px', position: 'relative' }}>
        <div style={{
          display: 'flex',
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-elevated)',
        }}>
          <div style={{
            width: `${subscriberPercent}%`,
            background: 'linear-gradient(90deg, var(--accent-purple) 0%, var(--accent-purple-light) 100%)',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 8px var(--accent-purple-glow)',
          }} />
        </div>

        {/* Labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '10px',
          fontSize: '12px',
          letterSpacing: '0.03em',
        }}>
          <span style={{
            color: 'var(--accent-purple-light)',
            fontWeight: '500',
          }}>
            ● Subscribers {subscriberPercent}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            ○ Guests {guestPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
