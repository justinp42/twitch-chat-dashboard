/**
 * Live Velocity Card
 *
 * Displays current messages per second with a circular gauge,
 * glowing effects, and percentage change indicator.
 */

interface LiveVelocityCardProps {
  velocity: number;
  previousVelocity?: number;
  peakVelocity?: number;
}

export function LiveVelocityCard({
  velocity,
  previousVelocity = 0,
  peakVelocity = 100,
}: LiveVelocityCardProps) {
  // Calculate percentage change
  const percentChange = previousVelocity > 0
    ? Math.round(((velocity - previousVelocity) / previousVelocity) * 100)
    : 0;
  const isPositive = percentChange >= 0;

  // Calculate gauge progress (0-1)
  const progress = Math.min(velocity / peakVelocity, 1);

  // Determine traffic status
  let status = 'Normal Traffic';
  let statusColor = 'var(--accent-green)';
  let statusIcon = '●';
  if (velocity > peakVelocity * 0.8) {
    status = 'High Traffic';
    statusColor = 'var(--accent-red)';
    statusIcon = '🔥';
  } else if (velocity > peakVelocity * 0.5) {
    status = 'Moderate Traffic';
    statusColor = 'var(--accent-orange)';
    statusIcon = '📈';
  }

  // SVG circle parameters
  const size = 90;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress * 0.75); // 270 degree arc

  const isHighActivity = velocity > peakVelocity * 0.7;

  return (
    <div className="card" style={{
      padding: '24px',
      background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(145, 70, 255, 0.05) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle glow overlay for high activity */}
      {isHighActivity && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(145, 70, 255, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div className="label" style={{ marginBottom: '16px', position: 'relative' }}>
        LIVE VELOCITY
      </div>

      {/* Main content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        {/* Value */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="value-xl" style={{
              textShadow: isHighActivity ? '0 0 20px var(--accent-purple-glow)' : 'none',
            }}>
              {Math.round(velocity)}
            </span>
            <span style={{
              fontSize: '18px',
              color: 'var(--text-muted)',
              fontWeight: '500',
            }}>/sec</span>
          </div>
        </div>

        {/* Circular gauge with percentage */}
        <div style={{ position: 'relative' }}>
          {/* Glow behind gauge */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size + 20,
            height: size + 20,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${isHighActivity ? 'rgba(145, 70, 255, 0.3)' : 'rgba(145, 70, 255, 0.15)'} 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }} />

          <svg
            width={size}
            height={size}
            style={{ transform: 'rotate(-225deg)', position: 'relative' }}
          >
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-purple-light)" />
                <stop offset="100%" stopColor="var(--accent-purple)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.75} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              filter={isHighActivity ? 'url(#glow)' : 'none'}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          {/* Percentage badge */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            padding: '5px 10px',
            borderRadius: '14px',
            backgroundColor: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
            color: 'white',
            fontSize: '11px',
            fontWeight: '700',
            boxShadow: isPositive
              ? '0 0 12px rgba(0, 245, 147, 0.4)'
              : '0 0 12px rgba(235, 4, 0, 0.4)',
          }}>
            {isPositive ? '+' : ''}{percentChange}%
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <span className="badge" style={{
          backgroundColor: `${statusColor}18`,
          color: statusColor,
          border: `1px solid ${statusColor}30`,
        }}>
          <span style={{ marginRight: '2px' }}>{statusIcon}</span>
          {status}
        </span>
        <span style={{
          marginLeft: '14px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}>
          Peak: {Math.round(peakVelocity)} msg/s
        </span>
      </div>
    </div>
  );
}
