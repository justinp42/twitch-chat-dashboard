/**
 * Velocity Chart Component
 *
 * Displays a line chart of messages per second over time.
 * Uses Recharts for the actual chart rendering.
 *
 * The chart shows the last 60 seconds of data, updating
 * in real-time as new metrics arrive.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MetricsDataPoint } from '../types';

interface VelocityChartProps {
  /** Historical metrics data */
  data: MetricsDataPoint[];
  /** Chart title */
  title?: string;
}

export function VelocityChart({
  data,
  title = 'Message Velocity',
}: VelocityChartProps) {
  // Format data for Recharts
  const chartData = data.map((point, index) => ({
    time: index,
    value: point.messagesPerSecond,
    label: point.timestamp.toLocaleTimeString(),
  }));

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
        {title}
      </h3>

      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => `${60 - value}s`}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#10b981' }}
              formatter={(value) => [`${Number(value).toFixed(1)} msg/s`, 'Velocity']}
              labelFormatter={(label) => chartData[label]?.label || ''}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              animationDuration={200}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
