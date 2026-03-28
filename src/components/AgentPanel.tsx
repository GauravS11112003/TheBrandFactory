import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

export interface AgentPanelProps {
  title: string;
  status: 'idle' | 'running' | 'completed';
  logs: string[];
  streamContent?: string;
  color: string;
  expandable?: boolean;
  onExpand?: () => void;
  children?: React.ReactNode;
}

// Animated "thinking" status that cycles through messages
const THINKING_MESSAGES = [
  'Thinking...',
  'Analyzing prompt...',
  'Formulating response...',
  'Processing context...',
  'Generating output...',
  'Reasoning...'
];

function ThinkingAnimation({ color }: { color: string }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      gap: '16px'
    }}>
      {/* Spinner */}
      <div style={{
        width: '28px',
        height: '28px',
        border: '3px solid #e0e0e0',
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      {/* Rotating message */}
      <div style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#999',
        textAlign: 'center',
        transition: 'opacity 0.3s ease'
      }}>
        {THINKING_MESSAGES[msgIndex]}
      </div>
      {/* Animated dots */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            opacity: 0.4,
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
    </div>
  );
}

// Parse markdown-ish LLM output into styled blocks
function RichText({ text, color }: { text: string; color: string }) {
  const lines = text.split('\n');
  
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: '6px' }} />;

        // **Bold headers** like "## Hook 1:" or "**Hook 1:**"
        if (/^#{1,3}\s/.test(trimmed) || /^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
          const clean = trimmed.replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '').replace(/:$/, '');
          return (
            <div key={i} style={{
              fontWeight: 900,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#000',
              marginTop: i > 0 ? '14px' : '0',
              marginBottom: '6px',
              padding: '5px 10px',
              background: color,
              border: '2px solid #000',
              boxShadow: '2px 2px 0 #000',
              display: 'inline-block'
            }}>
              {clean}
            </div>
          );
        }

        // Numbered list items
        if (/^\d+[\.\)]\s/.test(trimmed)) {
          const num = trimmed.match(/^(\d+)[\.\)]\s/)?.[1] || '';
          const rest = trimmed.replace(/^\d+[\.\)]\s/, '');
          return (
            <div key={i} style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '8px',
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.03)',
              borderLeft: `4px solid ${color}`,
              borderRadius: '0 4px 4px 0',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontWeight: 900,
                fontSize: '0.9rem',
                color: '#000',
                background: color,
                border: '2px solid #000',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '1px 1px 0 #000'
              }}>{num}</span>
              <span style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#222', fontWeight: 500 }}>
                <InlineBold text={rest} />
              </span>
            </div>
          );
        }

        // Bullet points
        if (/^[-*•]\s/.test(trimmed)) {
          const rest = trimmed.replace(/^[-*•]\s/, '');
          return (
            <div key={i} style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '4px',
              paddingLeft: '12px',
              alignItems: 'flex-start'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                background: color,
                border: '1.5px solid #000',
                borderRadius: '1px',
                flexShrink: 0,
                marginTop: '6px',
                transform: 'rotate(45deg)'
              }} />
              <span style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#333', fontWeight: 500 }}>
                <InlineBold text={rest} />
              </span>
            </div>
          );
        }

        // Regular paragraph text
        return (
          <div key={i} style={{
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: '#333',
            marginBottom: '4px',
            fontWeight: 400
          }}>
            <InlineBold text={trimmed} />
          </div>
        );
      })}
    </>
  );
}

// Render **bold** inline segments
function InlineBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800, color: '#000' }}>{p.slice(2, -2)}</strong>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function StreamRenderer({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(<thinking>[\s\S]*?<\/thinking>|<thinking>[\s\S]*$)/g);
  const [expandedThinking, setExpandedThinking] = useState<Record<number, boolean>>({});

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<thinking>')) {
          const inner = part.replace(/<\/?thinking>/g, '').trim();
          const isComplete = part.endsWith('</thinking>');
          if (!inner) return null;
          const isExpanded = expandedThinking[i] ?? !isComplete;

          return (
            <div key={i} style={{
              marginBottom: '12px',
              border: '2px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden',
              background: '#fafafa'
            }}>
              <div 
                onClick={() => setExpandedThinking(prev => ({ ...prev, [i]: !prev[i] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: '#f0f0f0',
                  cursor: 'pointer',
                  borderBottom: isExpanded ? '2px solid #ddd' : 'none',
                  userSelect: 'none'
                }}
              >
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.65rem'
                  }}>▶</span>
                  🧠 Thinking
                  {!isComplete && (
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#FF5A5F',
                      animation: 'pulse 0.8s infinite',
                      marginLeft: '4px'
                    }}/>
                  )}
                </span>
              </div>
              {isExpanded && (
                <div style={{
                  padding: '10px 14px',
                  color: '#777',
                  fontStyle: 'italic',
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {inner}
                </div>
              )}
            </div>
          );
        }

        const trimmed = part.trim();
        if (!trimmed) return null;
        return (
          <div key={i} style={{ marginBottom: '8px' }}>
            <RichText text={trimmed} color={color} />
          </div>
        );
      })}
    </>
  );
}

// ── Expanded Overlay Modal ──────────────────────────────────────
export function ExpandedAgentOverlay({ 
  title, 
  color, 
  content, 
  onClose, 
  onSave 
}: { 
  title: string; 
  color: string; 
  content: string; 
  onClose: () => void; 
  onSave: (newContent: string) => void;
}) {
  const [editableText, setEditableText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Strip <thinking> blocks and extract only the final output for editing
  useEffect(() => {
    const stripped = content
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .trim();
    setEditableText(stripped);
  }, [content]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '48px',
      animation: 'fadeIn 0.25s ease forwards'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '860px',
        maxHeight: 'calc(100vh - 96px)',
        display: 'flex',
        flexDirection: 'column',
        border: '4px solid #000',
        boxShadow: '8px 8px 0 #000',
        borderRadius: '4px',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards'
      }}>
        {/* Header bar */}
        <div style={{
          background: color,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '4px solid #000'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.6rem', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              color: '#000', 
              letterSpacing: '-0.02em' 
            }}>{title}</h2>
            <span style={{
              background: '#fff',
              border: '2px solid #000',
              padding: '4px 10px',
              fontSize: '0.7rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: '2px 2px 0 #000'
            }}>Expanded View</span>
          </div>
          <button 
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              background: '#fff',
              border: '3px solid #000',
              boxShadow: '3px 3px 0 #000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s ease'
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translate(3px, 3px)';
              el.style.boxShadow = '0 0 0 #000';
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget;
              el.style.transform = '';
              el.style.boxShadow = '3px 3px 0 #000';
            }}
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{
          background: '#f5f5f5',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #ddd'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isEditing ? '✏️ Editing Mode' : '📖 Read Mode'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                background: isEditing ? '#000' : '#fff',
                color: isEditing ? '#fff' : '#000',
                border: '2px solid #000',
                boxShadow: '2px 2px 0 #000',
                cursor: 'pointer',
                transition: 'all 0.1s ease'
              }}
            >
              {isEditing ? 'Preview' : 'Edit'}
            </button>
            {isEditing && (
              <button 
                onClick={() => {
                  onSave(editableText);
                  setIsEditing(false);
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: color,
                  color: '#000',
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0 #000',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
              >
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div style={{
          background: '#fff',
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px'
        }}>
          {isEditing ? (
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                border: '2px dashed #ccc',
                borderRadius: '4px',
                padding: '16px',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                fontFamily: "'Inter', sans-serif",
                color: '#222',
                background: '#fafafa',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          ) : (
            <div style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
              <StreamRenderer text={content} color={color} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main AgentPanel ─────────────────────────────────────────────
export function AgentPanel({ title, status, logs, streamContent, color, expandable, onExpand, children }: AgentPanelProps) {
  const isRunning = status === 'running';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamContent, logs]);

  return (
    <div className="brutal-box" style={{
      display: 'flex',
      flexDirection: 'column',
      background: color,
      height: '100%',
      minHeight: '340px',
      overflow: 'hidden',
      border: isRunning ? '5px solid #000' : '3px solid #000',
      boxShadow: isRunning ? '12px 12px 0 #000' : '4px 4px 0 #000',
      transform: isRunning ? 'scale(1.04) translateY(-6px)' : 'scale(0.96)',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      opacity: isRunning ? 1 : 0.85,
      position: 'relative',
      zIndex: isRunning ? 10 : 1
    }}>
      <div style={{
        background: color,
        padding: '16px',
        borderBottom: isRunning ? '5px solid #000' : '3px solid #000',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', color: '#000', fontWeight: 900, letterSpacing: '-0.02em' }}>{title}</h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#fff', 
            padding: '6px 12px', 
            borderRadius: '2px',
            border: '2px solid #000',
            boxShadow: '3px 3px 0 #000'
          }}>
            {status === 'running' && (
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#000',
                animation: 'pulse 0.8s infinite'
              }} />
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', letterSpacing: '0.05em' }}>
              {status === 'running' ? '⚡ Executing...' : status === 'completed' ? '✓ Finished' : 'Waiting...'}
            </span>
          </div>
        </div>

        {/* Expand button */}
        {expandable && status === 'completed' && (
          <button
            onClick={onExpand}
            title="Expand view"
            style={{
              width: '32px',
              height: '32px',
              background: '#fff',
              border: '2px solid #000',
              boxShadow: '2px 2px 0 #000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.1s ease'
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translate(2px, 2px)';
              el.style.boxShadow = '0 0 0 #000';
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget;
              el.style.transform = '';
              el.style.boxShadow = '2px 2px 0 #000';
            }}
          >
            <Maximize2 size={16} strokeWidth={3} />
          </button>
        )}
      </div>
      
      <div ref={contentRef} style={{ flex: 1, padding: '16px 14px', overflowY: 'auto', background: '#fff', fontSize: '0.85rem' }}>
        {logs.map((log, idx) => (
          <div key={idx} style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            color: '#555',
            fontWeight: 600,
            marginBottom: '8px',
            fontSize: '0.8rem',
            fontFamily: 'monospace'
          }}>
            <span style={{
              color: color,
              fontWeight: 900,
              fontSize: '0.85rem',
              textShadow: '1px 1px 0 #000'
            }}>&gt;</span>
            {log}
          </div>
        ))}

        {/* Thinking animation while waiting for stream */}
        {status === 'running' && !streamContent && (
          <ThinkingAnimation color={color} />
        )}

        {logs.length > 0 && streamContent && (
          <div style={{
            borderTop: '2px dashed #ddd',
            margin: '12px 0',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              top: '-8px',
              left: '12px',
              background: '#fff',
              padding: '0 8px',
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#aaa'
            }}>Agent Output</span>
          </div>
        )}

        {streamContent && <StreamRenderer text={streamContent} color={color} />}

        {status === 'running' && streamContent && (
          <div className="blink" style={{ color: '#000', fontWeight: 900, marginTop: '8px', fontSize: '1.2rem' }}>_</div>
        )}
      </div>
      
      {children && (
        <div style={{ borderTop: isRunning ? '5px solid #000' : '3px solid #000', background: '#fff' }}>
          {children}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.4); }
        }
        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
