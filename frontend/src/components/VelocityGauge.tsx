/**
 * Velocity Gauge Component
 *
 * Displays a semi-circular gauge showing messages per second.
 * Color changes based on velocity (green -> yellow -> red).
 *
 * The gauge is built with SVG for smooth animations and
 * precise control over the arc rendering.
 */

interface VelocityGaugeProps {
  /** Current messages per second */
  value: number;
  /** Maximum value for the gauge (default: 50) */
  max?: number;
  /** Label to show below the value */
  label?: string;
}

export function VelocityGauge({
  value,
  max = 50,
  label = 'msgs/sec',
}: VelocityGaugeProps) {
  // Clamp value between 0 and max
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = clampedValue / max;

  // Calculate arc path
  // We draw a semi-circle from -135deg to 135deg (270 degree arc)
  const radius = 80;
  const strokeWidth = 12;
  const centerX = 100;
  const centerY = 100;

  // Convert percentage to angle (0% = -135deg, 100% = 135deg)
  const startAngle = -135;
  const endAngle = startAngle + (270 * percentage);

  // Convert angles to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate arc endpoints
  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);

  // Determine if we need the large arc flag
  const largeArcFlag = percentage > 0.5 ? 1 : 0;

  // Background arc (full 270 degrees)
  const bgEndRad = ((startAngle + 270) * Math.PI) / 180;
  const bgX2 = centerX + radius * Math.cos(bgEndRad);
  const bgY2 = centerY + radius * Math.sin(bgEndRad);

  // Color based on percentage
  // 0-33%: green, 33-66%: yellow, 66-100%: red
  let color = '#10b981'; // green
  if (percentage > 0.66) {
    color = '#ef4444'; // red
  } else if (percentage > 0.33) {
    color = '#f59e0b'; // yellow
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#1f2937',
      borderRadius: '12px',
    }}>
      <svg width="200" height="140" viewBox="0 0 200 140">
        {/* Background arc */}
        <path
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${bgX2} ${bgY2}`}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        {percentage > 0 && (
          <path
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              transition: 'stroke 0.3s ease, d 0.3s ease',
            }}
          />
        )}

        {/* Value text */}
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          style={{
            fill: '#f3f4f6',
            fontSize: '36px',
            fontWeight: 'bold',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {value.toFixed(1)}
        </text>

        {/* Label */}
        <text
          x={centerX}
          y={centerY + 35}
          textAnchor="middle"
          style={{
            fill: '#9ca3af',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
