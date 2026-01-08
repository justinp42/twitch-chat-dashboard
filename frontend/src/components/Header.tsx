/**
 * Header Component
 *
 * Top navigation bar with Twitch branding:
 * - Logo and brand name
 * - Hype alert banner (center)
 * - Channel selector and live indicator
 */

import type { ConnectionState } from '../types';

interface HeaderProps {
  channels: string[];
  selectedChannel: string | null;
  onChannelChange: (channel: string) => void;
  connectionState: ConnectionState;
  hypeAlert?: { message: string; active: boolean };
}

export function Header({
  channels,
  selectedChannel,
  onChannelChange,
  connectionState,
  hypeAlert,
}: HeaderProps) {
  const isConnected = connectionState === 'connected';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 32px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-purple-dark) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px var(--accent-purple-glow)',
        }}>
          {/* Twitch-style glitch logo */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
          </svg>
        </div>
        <div>
          <span style={{
            fontSize: '17px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Twitch Intel
          </span>
          {selectedChannel && (
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '1px',
            }}>
              /{selectedChannel}
            </div>
          )}
        </div>
      </div>

      {/* Hype Alert Banner (center) */}
      {hypeAlert?.active && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 18px',
          background: 'linear-gradient(135deg, var(--accent-magenta) 0%, var(--accent-red) 100%)',
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 0 20px rgba(255, 0, 122, 0.4)',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'white',
            animation: 'pulse-dot 1s infinite',
          }} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>
            {hypeAlert.message}
          </span>
          <span style={{
            fontSize: '11px',
            opacity: 0.8,
            marginLeft: '4px',
          }}>
            NOW
          </span>
        </div>
      )}

      {/* Right side - Channel selector and live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Channel selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: 'white',
            }}>
              {selectedChannel ? selectedChannel.charAt(0).toUpperCase() : '?'}
            </span>
          </div>
          <select
            value={selectedChannel || ''}
            onChange={(e) => onChannelChange(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
              paddingRight: '4px',
            }}
          >
            {channels.length === 0 && (
              <option value="">No channels</option>
            )}
            {channels.map((channel) => (
              <option key={channel} value={channel} style={{ background: 'var(--bg-card)' }}>
                {channel}
              </option>
            ))}
          </select>
        </div>

        {/* Live indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          backgroundColor: isConnected ? 'rgba(0, 245, 147, 0.12)' : 'rgba(235, 4, 0, 0.12)',
          borderRadius: '20px',
          border: isConnected ? '1px solid rgba(0, 245, 147, 0.3)' : '1px solid rgba(235, 4, 0, 0.3)',
        }}>
          <span
            className={isConnected ? 'pulse-live' : ''}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--accent-green)' : 'var(--accent-red)',
            }}
          />
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: isConnected ? 'var(--accent-green)' : 'var(--accent-red)',
            letterSpacing: '0.03em',
          }}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </header>
  );
}
