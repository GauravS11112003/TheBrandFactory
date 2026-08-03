import { Lightbulb, FileText, Scissors, Clapperboard, ChevronRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  {
    n: '01',
    title: 'Ideation',
    color: '#FFE800',
    icon: <Lightbulb size={18} strokeWidth={3} color="#000" />,
    desc: 'Hooks, angles and campaign concepts pulled straight out of your brief.'
  },
  {
    n: '02',
    title: 'Scripting',
    color: '#00E5FF',
    icon: <FileText size={18} strokeWidth={3} color="#000" />,
    desc: 'A shot-by-shot script with voiceover beats and on-screen copy.'
  },
  {
    n: '03',
    title: 'Editing',
    color: '#FF4B8C',
    icon: <Scissors size={18} strokeWidth={3} color="#000" />,
    desc: 'Cuts, pacing and captions assembled in the production studio.'
  },
  {
    n: '04',
    title: 'Production',
    color: '#00FF66',
    icon: <Clapperboard size={18} strokeWidth={3} color="#000" />,
    desc: 'Final render stitched together and handed back for human review.'
  }
];

export function PipelineStrip() {
  return (
    <section style={{ padding: '0 32px', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      <SectionHeading label="The assembly line" title="Four agents, one belt" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {STEPS.map((step, idx) => (
          <div key={step.n} style={{ position: 'relative', display: 'flex' }}>
            <div className="brutal-box bf-lift" style={{ padding: '16px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: step.color,
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0 #000',
                  borderRadius: '4px',
                  flexShrink: 0
                }}>
                  {step.icon}
                </div>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#000',
                  opacity: 0.15,
                  marginLeft: 'auto',
                  letterSpacing: '-0.05em'
                }}>
                  {step.n}
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#000' }}>{step.title}</h3>
              <p style={{
                margin: 0,
                fontSize: '0.82rem',
                lineHeight: 1.45,
                fontWeight: 600,
                color: 'var(--text-muted)'
              }}>
                {step.desc}
              </p>
            </div>

            {idx < STEPS.length - 1 && (
              <div className="bf-step-arrow" aria-hidden="true">
                <ChevronRight size={20} strokeWidth={4} color="#000" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
