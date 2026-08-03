const STATS = [
  { value: '04', label: 'Agents on the line', color: '#FFE800' },
  { value: '01', label: 'Brief to finished cut', color: '#00E5FF' },
  { value: '∞', label: 'Revisions, steer anytime', color: '#FF4B8C' },
  { value: '100%', label: 'Human sign-off', color: '#00FF66' }
];

export function StatsBar() {
  return (
    <section style={{ padding: '0 32px', width: '100%', maxWidth: '1100px', margin: '72px auto 0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {STATS.map((stat) => (
          <div key={stat.label} className="brutal-box" style={{ padding: '18px 16px', textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '2.4rem',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.05em',
              color: '#000',
              marginBottom: '10px'
            }}>
              {stat.value}
            </div>
            <div style={{
              display: 'inline-block',
              background: stat.color,
              border: '2px solid #000',
              boxShadow: '2px 2px 0 #000',
              padding: '3px 8px',
              fontSize: '0.68rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#000'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
