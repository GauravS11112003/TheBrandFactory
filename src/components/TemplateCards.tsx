import { Zap, PlaySquare, Video } from 'lucide-react';

interface TemplateCardsProps {
  onSelect: (prompt: string) => void;
}

export function TemplateCards({ onSelect }: TemplateCardsProps) {
  const cards = [
    {
      title: 'TikTok Energy Drink',
      color: 'var(--brand-accent)',
      icon: <Zap size={16} color="#000" strokeWidth={3} />,
      prompt: 'I need a fast-paced 30-second TikTok ad for a new energy drink brand. Use high-energy cuts and bass drops.'
    },
    {
      title: 'SaaS Promo Video',
      color: 'var(--brand-secondary)',
      icon: <PlaySquare size={16} color="#000" strokeWidth={3} />,
      prompt: 'Create a clean, 30-second promo video for a new B2B SaaS product highlighting ease of use.'
    },
    {
      title: 'Sneaker Micro-Ad',
      color: 'var(--brand-primary)',
      icon: <Video size={16} color="#000" strokeWidth={3} />,
      prompt: 'Script and ideate a gritty, 30-second urban-style micro-ad for a new streetwear sneaker drop.'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      width: '100%',
      maxWidth: '760px',
      margin: '0 auto 16px auto',
      padding: '0 32px',
      justifyContent: 'flex-start',
    }}>
      {cards.map((card, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(card.prompt)}
          className="brutal-button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: '8px 16px',
            background: card.color,
            gap: '8px',
            boxShadow: '2px 2px 0 #000',
            border: '2px solid #000',
            transition: 'all 0.1s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translate(-2px, -2px)';
            e.currentTarget.style.boxShadow = '4px 4px 0 #000';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '2px 2px 0 #000';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translate(2px, 2px)';
            e.currentTarget.style.boxShadow = '0px 0px 0 #000';
          }}
        >
          {card.icon}
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>
            {card.title}
          </span>
        </button>
      ))}
    </div>
  );
}
