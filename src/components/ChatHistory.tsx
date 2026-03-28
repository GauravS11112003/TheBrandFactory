import { Bot, User } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  status?: 'processing' | 'completed';
}

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  if (messages.length === 0) return null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0 100px 0', display: 'flex', flexDirection: 'column', gap: '32px', scrollBehavior: 'smooth' }}>
      {messages.map((msg) => (
        <div key={msg.id} style={{
          display: 'flex',
          gap: '16px',
          maxWidth: '820px',
          margin: '0 auto',
          width: '100%',
          padding: '0 24px',
        }}>
          <div className="brutal-box" style={{
            width: '40px',
            height: '40px',
            background: msg.role === 'system' ? 'var(--brand-accent)' : 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '3px 3px 0 var(--border-color)'
          }}>
            {msg.role === 'system' ? <Bot size={24} color="#000" strokeWidth={2.5} /> : <User size={24} color="var(--text-primary)" strokeWidth={2.5} />}
          </div>
          <div className="brutal-box" style={{ 
            flex: 1, 
            padding: '20px', 
            background: msg.role === 'system' ? 'var(--bg-surface)' : '#e8e8e8',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', letterSpacing: '0.05em' }}>
              {msg.role === 'system' ? 'Brand Factory Agents' : 'You'}
            </span>
            
            <div style={{ color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontSize: '0.95rem', fontWeight: 500 }}>
              {msg.content}
            </div>

            {msg.status === 'processing' && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px 16px', 
                background: 'var(--brand-accent)', 
                border: 'var(--border-thick)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: 'fit-content',
                boxShadow: '3px 3px 0 #000'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '3px solid #000',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontWeight: 800, color: '#000', fontSize: '1rem', textTransform: 'uppercase' }}>
                  Booting Agents...
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
