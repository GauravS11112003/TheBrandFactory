interface SectionHeadingProps {
  label: string;
  title: string;
  color?: string;
}

/** Shared kicker + slab heading used by every landing section below the fold. */
export function SectionHeading({ label, title, color = 'var(--brand-accent)' }: SectionHeadingProps) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'inline-block',
        background: '#000',
        color: '#fff',
        padding: '4px 10px',
        fontSize: '0.7rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: '12px'
      }}>
        {label}
      </div>
      <h2 style={{
        margin: 0,
        fontSize: 'clamp(1.6rem, 3.4vw, 2.3rem)',
        lineHeight: 1,
        color: '#000'
      }}>
        <span style={{
          background: color,
          border: '3px solid #000',
          boxShadow: '4px 4px 0 #000',
          padding: '2px 12px',
          display: 'inline-block',
          transform: 'rotate(-1.5deg)'
        }}>
          {title}
        </span>
      </h2>
    </div>
  );
}
