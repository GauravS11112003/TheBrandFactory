import { useState, useEffect } from 'react';
import { AgentPanel, ExpandedAgentOverlay } from './AgentPanel';
import { ArrowUp, Play } from 'lucide-react';
import { streamAgentTask, streamProductionPipeline } from '../assets/lib/api';
import type { StreamConfig } from '../assets/lib/api';

function BootingPlaceholder({ title, color }: { title: string, color: string }) {
  return (
    <div className="brutal-box" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      height: '100%',
      minHeight: '340px',
      border: `4px dashed #000`,
      opacity: 0.8,
      boxShadow: '4px 4px 0 #000'
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '4px solid #000',
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase', color: '#000', fontWeight: 900, textAlign: 'center', letterSpacing: '0.05em' }}>
        Booting up<br/>{title}...
      </h3>
    </div>
  );
}

export function AgentDashboard({ userPrompt, onOpenEditor }: { userPrompt: string; onOpenEditor: (script: string, videoUrl: string) => void }) {
  const [isBooting, setIsBooting] = useState(true);
  
  const [ideationStatus, setIdeationStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [scriptStatus, setScriptStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [editStatus, setEditStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [prodStatus, setProdStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const [ideationLogs, setIdeationLogs] = useState<string[]>([]);
  const [scriptLogs, setScriptLogs] = useState<string[]>([]);
  const [editLogs, setEditLogs] = useState<string[]>([]);
  const [prodLogs, setProdLogs] = useState<string[]>([]);
  
  const [ideationStream, setIdeationStream] = useState('');
  const [scriptStream, setScriptStream] = useState('');
  const [editStream, setEditStream] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [expandedAgent, setExpandedAgent] = useState<null | 'ideation' | 'scripting'>(null);
  const [prodVideoUrl, setProdVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const runPipeline = async () => {
      const config: StreamConfig = {
        useLocal: localStorage.getItem('adfactory_uselocal') === 'true',
        localUrl: localStorage.getItem('adfactory_localurl') || 'http://localhost:11434'
      };

      // 1. Initial boot placeholders
      await new Promise(r => setTimeout(r, 1500));
      setIsBooting(false);

      // 2. Boot Ideation Request
      setIdeationLogs(['Boot sequence initiated...', 'Contacting LLM backend...']);
      setIdeationStatus('running');
      
      let ideationResult = '';
      await new Promise<void>((resolve) => {
        streamAgentTask('/api/agents/ideation/stream', { prompt: userPrompt }, config, 
          (text) => {
            setIdeationStream(text);
            ideationResult = text; 
          },
          () => resolve()
        );
      });
      
      setIdeationStatus('completed');
      
      await new Promise(r => setTimeout(r, 3000));
      
      // 3. Boot Scripting Request
      setScriptStatus('running');
      setScriptLogs(['Received hooks from Ideation.', 'Drafting 15s script...']);
      
      let scriptResult = '';
      await new Promise<void>((resolve) => {
         streamAgentTask('/api/agents/scripting/stream', { prompt: userPrompt, ideationOutput: ideationResult }, config,
           (text) => {
             setScriptStream(text);
             scriptResult = text;
           },
           () => resolve()
         );
      });
      
      setScriptStatus('completed');

      await new Promise(r => setTimeout(r, 3000));

      // 4. Boot Editing Request
      setEditStatus('running');
      setEditLogs(['Syncing visual cues from script.', 'Analyzing edit patterns...']);
      
      await new Promise<void>((resolve) => {
         streamAgentTask('/api/agents/editing/stream', { prompt: userPrompt, scriptOutput: scriptResult }, config,
           (text) => setEditStream(text),
           () => resolve()
         );
      });
      
      setEditStatus('completed');

      // 5. Automatic Production Pipeline
      setIsGenerating(true);
      setProdStatus('running');
      setProdLogs(['Initializing production pipeline...']);
      
      streamProductionPipeline(
        scriptResult,
        userPrompt,
        (message) => setProdLogs(prev => [...prev, `> ${message}`]),
        (scenes) => setProdLogs(prev => [...prev, `📋 ${scenes.length} scenes planned`]),
        (videoUrl) => {
          setProdVideoUrl(videoUrl);
          setProdStatus('completed');
          setProdLogs(prev => [...prev, '✅ Ad video generated!']);
          setIsGenerating(false);
        },
        (error) => {
          setProdLogs(prev => [...prev, `❌ Error: ${error}`]);
          setProdStatus('completed');
          setIsGenerating(false);
        }
      );
    };

    runPipeline();
  }, [userPrompt]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px 16px 40px 16px',
      height: 'calc(100vh - 160px)',
      minHeight: '500px'
    }}>
      {isBooting ? (
        <>
          <BootingPlaceholder title="Ideation Agent" color="#FFE800" />
          <BootingPlaceholder title="Scripting Agent" color="#00E5FF" />
          <BootingPlaceholder title="Editing Agent" color="#FF4B8C" />
          <BootingPlaceholder title="Production Agent" color="#00FF66" />
        </>
      ) : (
        <>
          <AgentPanel title="Ideation Agent" status={ideationStatus} logs={ideationLogs} streamContent={ideationStream} color="#FFE800" expandable onExpand={() => setExpandedAgent('ideation')} />
          <AgentPanel title="Scripting Agent" status={scriptStatus} logs={scriptLogs} streamContent={scriptStream} color="#00E5FF" expandable onExpand={() => setExpandedAgent('scripting')} />
          <AgentPanel title="Editing Agent" status={editStatus} logs={editLogs} streamContent={editStream} color="#FF4B8C">
            {/* Chat Interface for Editing Agent */}
            <div style={{ display: 'flex', padding: '12px', gap: '12px' }}>
              <input 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={editStatus !== 'running'}
                placeholder={editStatus === 'running' ? "Tell Editor: Make the cuts faster..." : "Agent offline..."}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}
              />
              <button 
                className="brutal-button"
                disabled={editStatus !== 'running'}
                onClick={() => {
                  if (chatInput.trim() && editStatus === 'running') {
                    setEditLogs(l => [...l, `[User]: ${chatInput}`, `Acknowledged. Adjusting style constraints.`, 'Passing finalizing cuts to Production agent >>']);
                    setChatInput('');
                    setTimeout(() => {
                      setEditStatus('completed');
                      setProdStatus('running');
                      setProdLogs(['Received final cut instructions.', 'Initializing rendering engine...', 'Queuing assets...']);
                    }, 1500);
                  }
                }}
                style={{ width: '36px', height: '36px', background: editStatus === 'running' ? '#000' : '#888', color: '#fff', border: '2px solid #000' }}
              >
                <ArrowUp size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Action buttons — appears after editing agent finishes */}
            {editStatus === 'completed' && (
              <div style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => prodVideoUrl && onOpenEditor(scriptStream, prodVideoUrl)}
                  disabled={prodStatus !== 'completed' || !prodVideoUrl}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: (prodStatus === 'completed' && prodVideoUrl) ? '#FFE800' : '#ccc',
                    border: '2px solid #000',
                    boxShadow: (prodStatus === 'completed' && prodVideoUrl) ? '3px 3px 0 #000' : 'none',
                    cursor: (prodStatus === 'completed' && prodVideoUrl) ? 'pointer' : 'not-allowed',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseDown={(e) => { if (prodStatus === 'completed' && prodVideoUrl) { e.currentTarget.style.transform = 'translate(3px,3px)'; e.currentTarget.style.boxShadow = '0 0 0 #000'; } }}
                  onMouseUp={(e) => { if (prodStatus === 'completed' && prodVideoUrl) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #000'; } }}
                >
                  <Play size={14} strokeWidth={3} />
                  {(prodStatus === 'running' || isGenerating) ? 'Rendering Video...' : 'Review Demo'}
                </button>
              </div>
            )}
          </AgentPanel>
          <AgentPanel title="Production Agent" status={prodStatus} logs={prodLogs} color="#00FF66">
          </AgentPanel>
        </>
      )}

      {/* Expanded overlay */}
      {expandedAgent === 'ideation' && (
        <ExpandedAgentOverlay
          title="Ideation Agent"
          color="#FFE800"
          content={ideationStream}
          onClose={() => setExpandedAgent(null)}
          onSave={(newContent) => {
            setIdeationStream(newContent);
            setExpandedAgent(null);
          }}
        />
      )}
      {expandedAgent === 'scripting' && (
        <ExpandedAgentOverlay
          title="Scripting Agent"
          color="#00E5FF"
          content={scriptStream}
          onClose={() => setExpandedAgent(null)}
          onSave={(newContent) => {
            setScriptStream(newContent);
            setExpandedAgent(null);
          }}
        />
      )}
    </div>
  );
}
