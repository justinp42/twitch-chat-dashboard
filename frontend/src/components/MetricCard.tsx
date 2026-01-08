/**
 * Metric Card Component
 *
 * A simple card for displaying a single metric value
 * with a label and optional icon.
 */

interface MetricCardProps {
  /** Card title/label */
  label: string;
  /** Value to display */
  value: string | number;
  /** Unit or suffix (optional) */
  unit?: string;
  /** Icon to show (optional) */
  icon?: string;
  /** Color accent (optional) */
  color?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  icon,
  color = '#3b82f6',
}: MetricCardProps) {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1f2937',
      borderRadius: '12px',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
      }}>
        {icon && (
          <span style={{ fontSize: '18px' }}>{icon}</span>
        )}
        <span style={{
          color: '#9ca3af',
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
      }}>
        <span style={{
          color: '#f3f4f6',
          fontSize: '32px',
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span style={{
            color: '#6b7280',
            fontSize: '16px',
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
