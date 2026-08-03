import { Sparkles, ArrowDown } from 'lucide-react';

export function HeroBlock() {
  return (
    <div style={{
      padding: '0 32px',
      width: '100%',
      /* 760px of content + the 32px gutters, so this lines up with the brief box */
      maxWidth: '824px',
      margin: '0 auto 24px auto'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--brand-secondary)',
        border: '2px solid #000',
        boxShadow: '2px 2px 0 #000',
        padding: '5px 10px',
        fontSize: '0.7rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '18px'
      }}>
        <Sparkles size={13} strokeWidth={3} color="#000" />
        Agentic ad production line
      </div>

      <h2 style={{
        margin: 0,
        fontSize: 'clamp(2.1rem, 5.2vw, 3.4rem)',
        lineHeight: 0.95,
        color: '#000'
      }}>
        Brief in.{' '}
        <span style={{
          display: 'inline-block',
          background: 'var(--brand-accent)',
          border: '3px solid #000',
          boxShadow: '5px 5px 0 #000',
          padding: '0 12px',
          transform: 'rotate(-2deg)'
        }}>
          Ad out.
        </span>
      </h2>

      <p style={{
        marginTop: '20px',
        maxWidth: '560px',
        fontSize: '1rem',
        lineHeight: 1.55,
        fontWeight: 600,
        color: 'var(--text-muted)'
      }}>
        Four agents ideate, script, edit and render your campaign end to end &mdash;
        streaming their work as they go. You steer, review, and ship.
      </p>
    </div>
  );
}

/** Bouncing cue that tells first-time visitors there is more page below. */
export function ScrollCue() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginTop: '28px',
      fontSize: '0.72rem',
      fontWeight: 900,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }}>
      <span>See how the line runs</span>
      <ArrowDown size={14} strokeWidth={3} className="bf-bob" />
    </div>
  );
}
