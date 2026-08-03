const ITEMS = [
  'IDEATION',
  'SCRIPTING',
  'STORYBOARDS',
  'EDITING',
  'VOICEOVER',
  'RENDER',
  'HUMAN REVIEW'
];

export function Marquee() {
  return (
    <div style={{
      overflow: 'hidden',
      background: '#000',
      borderTop: '3px solid #000',
      borderBottom: '3px solid #000',
      transform: 'rotate(-1deg)',
      /* pulled past the shell on both sides so the rotated ends stay off-screen */
      margin: '64px -40px'
    }}>
      <div className="bf-marquee" style={{ display: 'flex', width: 'max-content' }}>
        {[0, 1].map((half) => (
          <div key={half} style={{ display: 'flex', flexShrink: 0 }} aria-hidden={half === 1}>
            {ITEMS.map((item, idx) => (
              <div
                key={`${half}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '10px 20px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  whiteSpace: 'nowrap'
                }}
              >
                {item}
                <span style={{ color: 'var(--brand-accent)', fontSize: '1rem' }}>&#9733;</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
