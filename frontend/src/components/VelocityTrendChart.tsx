/**
 * Velocity Trend Chart
 *
 * Beautiful area chart showing message velocity over time
 * with hype markers, time range toggles, and gradient fill.
 */

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { MetricsDataPoint } from '../types';

interface VelocityTrendChartProps {
  data: MetricsDataPoint[];
  hypePoints?: { index: number; velocity: number }[];
}

type TimeRange = '1H' | '4H' | 'LIVE';

export function VelocityTrendChart({
  data,
  hypePoints = [],
}: VelocityTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('LIVE');

  // Format data for chart - data comes in per second
  const chartData = data.map((point, index) => {
    const secondsAgo = data.length - index;

    return {
      index,
      value: point.messagesPerSecond,
      secondsAgo,
      time: point.timestamp.toLocaleTimeString(),
    };
  });

  // Get subtitle based on time range
  const getSubtitle = () => {
    switch (timeRange) {
      case 'LIVE': return `Last ${data.length} Seconds`;
      case '1H': return 'Last 60 Minutes';
      case '4H': return 'Last 4 Hours';
      default: return '';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--accent-purple)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 0 20px var(--accent-purple-glow)',
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {chartData[label]?.time || ''}
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--accent-purple-light)',
          }}>
            {Number(payload[0].value).toFixed(1)} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>msg/s</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{
      padding: '24px',
      background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(145, 70, 255, 0.03) 100%)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
      }}>
        <div>
          <div className="label" style={{ marginBottom: '6px' }}>
            VELOCITY TREND
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
          }}>
            {getSubtitle()}
          </div>
        </div>

        {/* Time range toggles */}
        <div className="btn-group">
          {(['1H', '4H', 'LIVE'] as TimeRange[]).map((range) => (
            <button
              key={range}
              className={`btn ${timeRange === range ? 'btn-active' : ''}`}
              onClick={() => setTimeRange(range)}
              style={{
                border: 'none',
                position: 'relative',
              }}
            >
              {range === 'LIVE' && timeRange === 'LIVE' && (
                <span style={{
                  position: 'absolute',
                  left: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-green)',
                  boxShadow: '0 0 6px var(--accent-green)',
                }} />
              )}
              <span style={{ marginLeft: range === 'LIVE' && timeRange === 'LIVE' ? '8px' : 0 }}>
                {range}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9146ff" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#9146ff" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#9146ff" stopOpacity={0.02} />
              </linearGradient>
              <filter id="chartGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <XAxis
              dataKey="index"
              stroke="var(--border-color)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-color)', strokeOpacity: 0.5 }}
              tickFormatter={(value) => {
                const point = chartData[value];
                if (!point) return '';
                const secondsAgo = chartData.length - value;

                // NOW label for most recent point
                if (secondsAgo === 1) return 'NOW';

                // Labels based on selected time range
                if (timeRange === 'LIVE') {
                  // LIVE: Show every 15 seconds up to 60s
                  if (secondsAgo === 15) return '15s';
                  if (secondsAgo === 30) return '30s';
                  if (secondsAgo === 45) return '45s';
                  if (secondsAgo === 60) return '60s';
                } else if (timeRange === '1H') {
                  // 1H: Show every 10 minutes up to 60m
                  if (secondsAgo === 600) return '10m';
                  if (secondsAgo === 1200) return '20m';
                  if (secondsAgo === 1800) return '30m';
                  if (secondsAgo === 2400) return '40m';
                  if (secondsAgo === 3000) return '50m';
                  if (secondsAgo === 3600) return '60m';
                } else if (timeRange === '4H') {
                  // 4H: Show every 30 minutes up to 4h
                  if (secondsAgo === 1800) return '30m';
                  if (secondsAgo === 3600) return '1h';
                  if (secondsAgo === 5400) return '1h30';
                  if (secondsAgo === 7200) return '2h';
                  if (secondsAgo === 9000) return '2h30';
                  if (secondsAgo === 10800) return '3h';
                  if (secondsAgo === 12600) return '3h30';
                  if (secondsAgo === 14400) return '4h';
                }
                return '';
              }}
            />

            <YAxis
              stroke="var(--border-color)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              width={40}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#9146ff"
              strokeWidth={2.5}
              fill="url(#colorVelocity)"
              dot={false}
              activeDot={{
                r: 7,
                fill: '#9146ff',
                stroke: '#a970ff',
                strokeWidth: 3,
                filter: 'url(#chartGlow)',
              }}
            />

            {/* Hype markers */}
            {hypePoints.map((point, i) => (
              <ReferenceDot
                key={i}
                x={point.index}
                y={point.velocity}
                r={0}
                label={{
                  value: 'HYPE',
                  position: 'top',
                  fill: 'white',
                  fontSize: 10,
                  fontWeight: 600,
                  offset: 20,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hype indicator badge (positioned over chart) */}
      {hypePoints.length > 0 && (
        <div style={{
          position: 'relative',
          marginTop: '-260px',
          marginLeft: '45%',
          display: 'inline-block',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-magenta) 0%, var(--accent-red) 100%)',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            boxShadow: '0 0 16px rgba(255, 0, 122, 0.5)',
            letterSpacing: '0.05em',
          }}>
            HYPE
          </div>
          <div style={{
            width: '0',
            height: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--accent-red)',
            margin: '0 auto',
          }} />
        </div>
      )}
    </div>
  );
}
