import { useState } from 'react';
import { Header } from './components/Header';
import { ChatInput } from './components/ChatInput';
import { TemplateCards } from './components/TemplateCards';
import { AgentDashboard } from './components/AgentDashboard';
import { VideoEditor } from './components/VideoEditor';

function App() {
  const [viewState, setViewState] = useState<'landing' | 'dashboard' | 'editor'>('landing');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasVisitedDashboard, setHasVisitedDashboard] = useState(false);
  const [hasVisitedEditor, setHasVisitedEditor] = useState(false);
  
  const [editorVideoUrl, setEditorVideoUrl] = useState<string>('');
  const [editorScript, setEditorScript] = useState<string>('');

  const handleSubmit = (text: string) => {
    setCurrentPrompt(text);
    setIsProcessing(true);
    
    setTimeout(() => {
      setViewState('dashboard');
      setHasVisitedDashboard(true);
      setIsProcessing(false);
    }, 2000);
  }

  const resetToHome = () => {
    setViewState('landing');
    setCurrentPrompt('');
    setIsProcessing(false);
  };

  const openEditor = (script: string, videoUrl: string) => {
    setEditorScript(script);
    setEditorVideoUrl(videoUrl);
    setHasVisitedEditor(true);
    setViewState('editor');
  };

  return (
    <>
      {/* Editor — full-screen, rendered once visited, hidden when not active */}
      {hasVisitedEditor && (
        <div style={{ display: viewState === 'editor' ? 'block' : 'none', position: viewState === 'editor' ? 'relative' : 'absolute', width: '100%', height: '100vh' }}>
          <VideoEditor 
            initialVideoUrl={editorVideoUrl}
            onBack={() => setViewState('dashboard')} 
            onProceed={() => setViewState('dashboard')}
          />
        </div>
      )}

      {/* Main app shell — hidden when editor is active */}
      <div style={{ 
        display: viewState === 'editor' ? 'none' : 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'transparent',
        position: 'relative'
      }}>
        <Header isDocked={viewState === 'dashboard'} onHomeClick={resetToHome} />
        
        <main style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative',
          overflow: 'hidden',
          justifyContent: viewState === 'landing' ? 'center' : 'flex-start',
          paddingTop: viewState === 'dashboard' ? '24px' : '0',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {viewState === 'landing' && (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="animate-fade-in">
               <TemplateCards onSelect={handleSubmit} />
               <div style={{ 
                  padding: '0 32px', 
                  width: '100%',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <ChatInput onSubmit={handleSubmit} disabled={isProcessing} isDocked={false} />
               </div>
             </div>
          )}

          {/* Dashboard stays mounted once visited — just hidden via display */}
          {hasVisitedDashboard && (
            <div style={{ 
              flex: 1, 
              display: viewState === 'dashboard' ? 'flex' : 'none', 
              flexDirection: 'column', 
              padding: '0 24px', 
              gap: '24px' 
            }}>
              <div style={{ zIndex: 10, animation: 'fadeIn 0.6s ease forwards', opacity: 0, padding: '0 80px', paddingTop: '16px' }}>
                <ChatInput onSubmit={(text) => console.log('Refined:', text)} disabled={false} isDocked={true} initialValue={currentPrompt} />
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px', animation: 'fadeIn 0.6s ease 0.2s forwards', opacity: 0 }}>
                 <AgentDashboard userPrompt={currentPrompt} onOpenEditor={openEditor} />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default App
