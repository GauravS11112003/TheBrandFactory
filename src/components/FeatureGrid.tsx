import { Activity, MessageSquarePlus, Film, Cpu, Paperclip, ShieldCheck } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const FEATURES = [
  {
    title: 'Live agent streaming',
    color: '#FFE800',
    icon: <Activity size={16} strokeWidth={3} color="#000" />,
    desc: 'Every agent streams its logs and drafts token by token. No black box.'
  },
  {
    title: 'Steer mid-run',
    color: '#00E5FF',
    icon: <MessageSquarePlus size={16} strokeWidth={3} color="#000" />,
    desc: 'Drop new instructions into the pipeline while the crew is still working.'
  },
  {
    title: 'Built-in editor',
    color: '#FF4B8C',
    icon: <Film size={16} strokeWidth={3} color="#000" />,
    desc: 'Open any cut in the studio to trim, reorder and re-render on the spot.'
  },
  {
    title: 'Bring your own model',
    color: '#00FF66',
    icon: <Cpu size={16} strokeWidth={3} color="#000" />,
    desc: 'Point the crew at a local Ollama backend or the hosted API. Your call.'
  },
  {
    title: 'Brand assets in',
    color: '#FFE800',
    icon: <Paperclip size={16} strokeWidth={3} color="#000" />,
    desc: 'Attach scripts, logos and references so the output stays on brand.'
  },
  {
    title: 'Human sign-off',
    color: '#00E5FF',
    icon: <ShieldCheck size={16} strokeWidth={3} color="#000" />,
    desc: 'Agents do the work, but nothing ships without your review.'
  }
];

export function FeatureGrid() {
  return (
    <section style={{ padding: '0 32px', width: '100%', maxWidth: '1100px', margin: '72px auto 0 auto' }}>
      <SectionHeading label="Inside the factory" title="What you get" color="var(--brand-secondary)" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {FEATURES.map((feature) => (
          <div key={feature.title} className="brutal-box bf-lift" style={{ padding: '16px', display: 'flex', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: feature.color,
              border: '2px solid #000',
              boxShadow: '2px 2px 0 #000',
              borderRadius: '4px'
            }}>
              {feature.icon}
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', color: '#000' }}>{feature.title}</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, fontWeight: 600, color: 'var(--text-muted)' }}>
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
