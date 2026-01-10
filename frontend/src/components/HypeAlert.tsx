/**
 * Hype Alert Component
 *
 * Animated banner that appears when a chat velocity spike is detected.
 * Features:
 * - Pulsing glow animation
 * - Velocity and multiplier display
 * - Auto-dismiss after 10 seconds
 * - Manual dismiss button
 */

import type { HypeEvent } from '../types';

interface HypeAlertProps {
  event: HypeEvent;
  onDismiss: () => void;
}

export function HypeAlert({ event, onDismiss }: HypeAlertProps) {
  const timestamp = new Date(event.timestamp);
  const timeString = timestamp.toLocaleTimeString();

  return (
    <div
      className="hype-alert"
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'linear-gradient(135deg, #ff007a 0%, #eb0400 50%, #ff6b00 100%)',
        borderRadius: '16px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 0 40px rgba(255, 0, 122, 0.5), 0 0 80px rgba(255, 0, 122, 0.3)',
        animation: 'hype-pulse 2s ease-in-out infinite, hype-slide-in 0.3s ease-out',
        maxWidth: '90vw',
      }}
    >
      {/* Pulsing icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'hype-icon-pulse 1s ease-in-out infinite',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            HYPE DETECTED!
          </span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white',
            }}
          >
            {event.channel}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
          }}
        >
          <span>
            <strong style={{ color: 'white', fontSize: '16px' }}>
              {event.velocity.toFixed(1)}
            </strong>{' '}
            msg/s
          </span>
          <span>
            <strong style={{ color: 'white', fontSize: '16px' }}>
              {event.multiplier.toFixed(1)}x
            </strong>{' '}
            above normal
          </span>
          <span style={{ opacity: 0.7 }}>{timeString}</span>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          fontSize: '18px',
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
      >
        ×
      </button>

      <style>{`
        @keyframes hype-pulse {
          0%, 100% {
            box-shadow: 0 0 40px rgba(255, 0, 122, 0.5), 0 0 80px rgba(255, 0, 122, 0.3);
          }
          50% {
            box-shadow: 0 0 60px rgba(255, 0, 122, 0.7), 0 0 120px rgba(255, 0, 122, 0.4);
          }
        }

        @keyframes hype-slide-in {
          from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        @keyframes hype-icon-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
