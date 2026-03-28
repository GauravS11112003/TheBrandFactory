import { useState, useEffect } from 'react';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [useLocal, setUseLocal] = useState(false);
  const [localUrl, setLocalUrl] = useState('http://localhost:11434');
  
  // Load from storage
  useEffect(() => {
    const savedLocal = localStorage.getItem('adfactory_uselocal') === 'true';
    const savedUrl = localStorage.getItem('adfactory_localurl');
    setUseLocal(savedLocal);
    if (savedUrl) setLocalUrl(savedUrl);
  }, []);

  const handleSave = () => {
    localStorage.setItem('adfactory_uselocal', useLocal ? 'true' : 'false');
    localStorage.setItem('adfactory_localurl', localUrl);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="brutal-box" style={{
        background: '#fff',
        padding: '32px',
        border: '4px solid #000',
        boxShadow: '12px 12px 0 #000',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <h2 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 900 }}>Settings</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 800 }}>Model Source</label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <input type="radio" checked={!useLocal} onChange={() => setUseLocal(false)} />
              Gemini API
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <input type="radio" checked={useLocal} onChange={() => setUseLocal(true)} />
              Local Model (Ollama)
            </label>
          </div>
        </div>

        {useLocal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 800 }}>Local API URL</label>
            <input 
              value={localUrl}
              onChange={e => setLocalUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '3px solid #000',
                background: '#f4f4f4',
                outline: 'none',
                fontWeight: 600
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#666', fontSize: '0.9rem', fontWeight: 600 }}>
            Ensure your GEMINI_API_KEY is securely configured in the backend server's .env file.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button 
            className="brutal-button"
            onClick={onClose}
            style={{ padding: '8px 16px', fontWeight: 800, border: '3px solid #000', background: '#ccc', cursor: 'pointer' }}
          >
            CANCEL
          </button>
          <button 
            className="brutal-button"
            onClick={handleSave}
            style={{ padding: '8px 16px', fontWeight: 800, border: '3px solid #000', background: 'var(--brand-secondary)', cursor: 'pointer' }}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
