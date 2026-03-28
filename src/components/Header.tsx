import { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export function Header({ isDocked = false, onHomeClick }: { isDocked?: boolean; onHomeClick?: () => void }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className={isDocked ? "header-docked" : "brutal-box"} style={{
        position: isDocked ? 'absolute' : 'sticky',
        top: isDocked ? '16px' : '12px',
        left: isDocked ? '0' : 'auto',
        width: isDocked ? '100%' : 'auto',
        zIndex: 100,
        padding: isDocked ? '0 16px' : '12px 24px',
        margin: isDocked ? '0' : '12px 24px 0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        background: isDocked ? 'transparent' : '#ffffff',
        boxShadow: isDocked ? 'none' : '4px 4px 0 var(--border-color)',
        border: isDocked ? 'none' : '2px solid #000',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isDocked ? 'none' : 'auto'
      }}>
        {/* Left Column: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
          <div style={{
            background: '#fff',
            width: isDocked ? '64px' : '48px',
            height: isDocked ? '64px' : '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDocked ? '6px 6px 0 #000' : '4px 4px 0 #000',
            border: isDocked ? '4px solid #000' : '3px solid #000',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'pointer'
          }} onClick={() => {
            if (onHomeClick) {
              onHomeClick();
            } else {
              window.location.href = '/';
            }
          }}>
            <div style={{ position: 'absolute', top: isDocked ? '-14px' : '-10px', left: isDocked ? '-14px' : '-10px', width: isDocked ? '36px' : '24px', height: isDocked ? '36px' : '24px', background: '#FF4B8C', borderRadius: '50%', border: isDocked ? '4px solid #000' : '3px solid #000', transition: 'all 0.6s ease' }} />
            <div style={{ position: 'absolute', bottom: isDocked ? '-18px' : '-14px', right: isDocked ? '-18px' : '-14px', width: isDocked ? '44px' : '32px', height: isDocked ? '44px' : '32px', background: '#00E5FF', borderRadius: '50%', border: isDocked ? '4px solid #000' : '3px solid #000', transition: 'all 0.6s ease' }} />
            <svg viewBox="0 0 24 24" width={isDocked ? "32" : "24"} height={isDocked ? "32" : "24"} fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1, left: '2px', transition: 'all 0.6s ease' }}>
              <polygon points="5 3 19 12 5 21 5 3" fill="#FFE800" />
            </svg>
          </div>
        </div>

        {/* Center Column: Text */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          opacity: isDocked ? 0 : 1,
          transform: isDocked ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.6rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#000',
            textTransform: 'uppercase',
            background: 'var(--brand-accent)',
            padding: '4px 16px',
            border: '3px solid #000',
            boxShadow: '4px 4px 0 #000',
            transform: 'rotate(-2deg)'
          }}>
            The Brand Factory
          </h1>
        </div>

        {/* Right Column: Settings & App Tag */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '16px',
          transition: 'all 0.6s ease',
          paddingRight: isDocked ? '0' : '12px',
          position: isDocked ? 'absolute' : 'relative',
          top: isDocked ? '16px' : 'auto',
          right: isDocked ? '16px' : 'auto',
          zIndex: isDocked ? 1000 : 1
        }}>
          <div style={{ background: 'var(--brand-secondary)', border: '2px solid #000', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', boxShadow: '2px 2px 0 #000', opacity: isDocked ? 0 : 1 }}>
            Production Studio
          </div>
          <button
            className="brutal-button"
            onClick={() => setShowSettings(true)}
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '3px solid #000', borderRadius: '4px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', pointerEvents: 'auto' }}
          >
            <Settings size={20} strokeWidth={2.5} color="#000" />
          </button>
        </div>
      </header>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
