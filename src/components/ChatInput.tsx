import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Plus } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  isDocked?: boolean;
  initialValue?: string;
}

export function ChatInput({ onSubmit, disabled, isDocked, initialValue = '' }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (textareaRef.current && !isDocked) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text, isDocked]);

  const handleSubmit = () => {
    if ((text.trim() || initialValue) && !disabled) {
      onSubmit(text);
      if (!isDocked) setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: isDocked ? '100%' : '760px', 
      margin: '0 auto',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div className="brutal-box" style={{
        display: 'flex',
        flexDirection: isDocked ? 'row' : 'column',
        padding: isDocked ? '12px 24px' : '16px',
        alignItems: isDocked ? 'center' : 'stretch',
        background: '#ffffff',
        transform: (!isDocked && isFocused) ? 'translate(2px, 2px)' : 'none',
        boxShadow: (!isDocked && isFocused) ? 'var(--shadow-brutal-hover)' : 'var(--shadow-brutal)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        gap: isDocked ? '16px' : '0'
      }}>
        {isDocked ? (
          <>
            <div style={{ fontWeight: 800, color: 'var(--brand-accent)', textTransform: 'uppercase', flexShrink: 0 }}>
              Original Prompt
            </div>
            <div style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '2px solid var(--border-color)', paddingRight: '16px' }}>
              {initialValue}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Plus size={16} color="var(--brand-secondary)" strokeWidth={3} />
              <input 
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add more instructions or steering..."
                disabled={disabled}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={disabled || !text.trim()}
              className="brutal-button"
              style={{
                width: '36px',
                height: '36px',
                background: 'var(--brand-primary)',
                flexShrink: 0
              }}
            >
              <ArrowUp size={20} strokeWidth={3} color="#000" />
            </button>
          </>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Describe your ad, upload a script, or drop your brand assets here..."
              disabled={disabled}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 500,
                resize: 'none',
                minHeight: '40px',
                maxHeight: '160px',
                outline: 'none',
                lineHeight: 1.5
              }}
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: 'var(--border-thick)'
            }}>
              <button 
                disabled={disabled}
                className="brutal-button"
                style={{
                  padding: '8px 16px',
                  gap: '6px',
                }}
              >
                <Paperclip size={18} strokeWidth={2.5}/>
                <span style={{ fontSize: '0.85rem' }}>ATTACH INFO</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={disabled || !text.trim()}
                className="brutal-button"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--brand-primary)',
                }}
              >
                <ArrowUp size={22} strokeWidth={3} color="#000" />
              </button>
            </div>
          </>
        )}
      </div>
      {!isDocked && (
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          AI agents will execute requests. Human review required for final assets.
        </div>
      )}
    </div>
  );
}
