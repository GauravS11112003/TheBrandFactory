import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, ArrowUp, Loader, Film, Scissors, Wand2, ChevronRight } from 'lucide-react';

interface EditHistoryItem {
  id: number;
  command: string;
  description: string;
  videoId: string;
  videoUrl: string;
}

const API_BASE = 'http://localhost:3000';

export function VideoEditor({ initialVideoUrl, scriptText, onBack, onProceed }: { initialVideoUrl?: string; scriptText?: string; onBack: () => void; onProceed: () => void }) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string>('');
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (initialVideoUrl && !videoUrl) {
      const actualFilename = initialVideoUrl.split('/').pop() || 'generated-1.mp4';
      setVideoUrl(initialVideoUrl);
      setVideoId(actualFilename);
      setOriginalName('Auto-Generated Ad');
      setEditHistory([{
        id: 0,
        command: 'Original generation',
        description: 'Autonomous AI Production',
        videoId: actualFilename,
        videoUrl: initialVideoUrl
      }]);
    }
  }, [initialVideoUrl, videoUrl]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch(`${API_BASE}/api/editor/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setVideoId(data.videoId);
      setVideoUrl(`${API_BASE}${data.url}`);
      setOriginalName(data.originalName);
      setEditHistory([{
        id: 0,
        command: 'Original upload',
        description: `Uploaded: ${data.originalName}`,
        videoId: data.videoId,
        videoUrl: `${API_BASE}${data.url}`
      }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyEdit = async () => {
    if (!chatInput.trim() || !videoId) return;
    const command = chatInput.trim();
    setChatInput('');
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/editor/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, command })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Edit failed');

      setVideoId(data.videoId);
      setVideoUrl(`${API_BASE}${data.url}`);
      setEditHistory(prev => [...prev, {
        id: prev.length,
        command,
        description: data.description,
        videoId: data.videoId,
        videoUrl: `${API_BASE}${data.url}`
      }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const jumpToVersion = (item: EditHistoryItem) => {
    setVideoId(item.videoId);
    setVideoUrl(item.videoUrl);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-base)',
      overflow: 'hidden'
    }}>
      {/* ── Top Navigation Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '3px solid #000',
        background: '#fff',
        boxShadow: '0 4px 0 #000',
        zIndex: 10
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#fff',
            border: '2px solid #000',
            boxShadow: '3px 3px 0 #000',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            transition: 'all 0.1s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '0 0 0 #000'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #000'; }}
        >
          <ArrowLeft size={16} strokeWidth={3} />
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Film size={24} strokeWidth={3} />
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            AI Video Editor
          </h1>
        </div>

        <button
          onClick={onProceed}
          disabled={editHistory.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: editHistory.length > 0 ? '#00FF66' : '#ddd',
            border: '2px solid #000',
            boxShadow: '3px 3px 0 #000',
            cursor: editHistory.length > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            transition: 'all 0.1s ease'
          }}
          onMouseDown={(e) => { if (editHistory.length > 0) { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '0 0 0 #000'; } }}
          onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #000'; }}
        >
          Push to Production
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>

      {/* ── Main Content ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '0',
        overflow: 'hidden'
      }}>
        {/* ── Left: Video Preview ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '3px solid #000',
          background: '#1a1a1a',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative'
        }}>
          {!videoUrl ? (
            /* Upload prompt */
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                padding: '48px',
                border: '4px dashed #555',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                maxWidth: '480px',
                width: '100%'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFE800'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#555'; }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#FFE800',
                border: '3px solid #000',
                boxShadow: '4px 4px 0 #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Upload size={32} strokeWidth={3} color="#000" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 900 }}>
                  Upload Your Video
                </h3>
                <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                  Drag & drop or click to select a video file (.mp4, .mov, .avi)
                </p>
              </div>
            </div>
          ) : (
            /* Video player */
            <div style={{ width: '100%', maxWidth: '720px', position: 'relative' }}>
              {/* Video label */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  background: '#FFE800',
                  border: '2px solid #000',
                  padding: '4px 12px',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  boxShadow: '2px 2px 0 #000',
                  color: '#000'
                }}>
                  {originalName}
                </span>
                <span style={{
                  color: '#888',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  Version {editHistory.length > 0 ? editHistory.length : 1}
                </span>
              </div>

              <video
                ref={videoRef}
                key={videoUrl}
                src={videoUrl}
                controls
                style={{
                  width: '100%',
                  border: '3px solid #000',
                  boxShadow: '6px 6px 0 #000',
                  background: '#000',
                  borderRadius: '2px'
                }}
              />

              {/* Processing overlay */}
              {isProcessing && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  border: '3px solid #000'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #FFE800',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <div style={{ color: '#FFE800', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                    Applying Edit...
                  </div>
                  <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Wand2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    AI is generating FFmpeg command
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />

          {/* Upload progress */}
          {isUploading && (
            <div style={{
              position: 'absolute',
              bottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#000',
              border: '2px solid #FFE800',
              padding: '12px 20px',
              boxShadow: '4px 4px 0 #FFE800'
            }}>
              <Loader size={18} color="#FFE800" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#FFE800', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>Uploading...</span>
            </div>
          )}
        </div>

        {/* ── Right: Edit Panel ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          overflow: 'hidden'
        }}>
          {/* Edit History */}
          <div style={{
            padding: '16px',
            borderBottom: '3px solid #000',
            background: '#FF4B8C'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1rem',
              textTransform: 'uppercase',
              fontWeight: 900,
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Scissors size={18} strokeWidth={3} />
              Edit Timeline
            </h3>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px'
          }}>
            {editHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999'
              }}>
                <Wand2 size={32} strokeWidth={2} color="#ccc" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                  Upload a video to start editing
                </p>
                <p style={{ fontSize: '0.75rem', fontWeight: 400, margin: '8px 0 0', color: '#bbb' }}>
                  Type natural language commands like "speed up 2x" or "trim first 3 seconds"
                </p>
              </div>
            ) : (
              editHistory.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => jumpToVersion(item)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '10px 12px',
                    marginBottom: '8px',
                    border: item.videoId === videoId ? '2px solid #000' : '2px solid #eee',
                    boxShadow: item.videoId === videoId ? '3px 3px 0 #000' : 'none',
                    background: item.videoId === videoId ? '#FFF8E1' : '#fff',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    color: '#000',
                    background: idx === 0 ? '#FFE800' : '#FF4B8C',
                    border: '2px solid #000',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '1px 1px 0 #000'
                  }}>
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#000',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.command}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#888',
                      fontWeight: 500,
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.description}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              padding: '10px 16px',
              background: '#FF5A5F',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderTop: '2px solid #000',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '1rem' }}>×</button>
            </div>
          )}

          {/* Chat input for NL edits */}
          <div style={{
            padding: '12px',
            borderTop: '3px solid #000',
            background: '#f5f5f5',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleApplyEdit(); } }}
              disabled={!videoId || isProcessing}
              placeholder={!videoId ? 'Upload a video first...' : isProcessing ? 'Processing edit...' : 'e.g. "Speed up 2x", "Trim first 3 seconds"...'}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '2px solid #000',
                boxShadow: '3px 3px 0 #000',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: '#fff',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handleApplyEdit}
              disabled={!videoId || isProcessing || !chatInput.trim()}
              style={{
                width: '42px',
                height: '42px',
                background: videoId && chatInput.trim() && !isProcessing ? '#FFE800' : '#ddd',
                border: '2px solid #000',
                boxShadow: '3px 3px 0 #000',
                cursor: videoId && chatInput.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s ease',
                flexShrink: 0
              }}
              onMouseDown={(e) => { if (videoId && chatInput.trim()) { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '0 0 0 #000'; } }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #000'; }}
            >
              {isProcessing ? (
                <Loader size={18} strokeWidth={3} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <ArrowUp size={20} strokeWidth={3} />
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
