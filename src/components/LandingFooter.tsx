import { ArrowUp } from 'lucide-react';

export function LandingFooter() {
  const scrollToBrief = () => {
    document.getElementById('bf-hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer style={{ padding: '0 32px', width: '100%', maxWidth: '1100px', margin: '72px auto 48px auto' }}>
      <div className="brutal-box" style={{
        background: '#000',
        padding: '28px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        boxShadow: '6px 6px 0 var(--brand-primary)'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', lineHeight: 1 }}>
            Ready to run a brief?
          </h2>
          <p style={{
            margin: 0,
            color: '#bbbbbb',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            AI agents execute requests &middot; Human review required for final assets
          </p>
        </div>

        <button className="brutal-button" onClick={scrollToBrief} style={{ padding: '12px 20px', gap: '8px' }}>
          <ArrowUp size={18} strokeWidth={3} color="#000" />
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Start a brief</span>
        </button>
      </div>
    </footer>
  );
}
