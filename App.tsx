import React, { useState, useEffect, useRef } from 'react';
import { Message, SystemStats, ChatSession } from './types';
import CommandCenter from './components/CommandCenter';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import LiveCall from './components/LiveCall';
import { generateDaneybilResponse, speakResponse } from './services/geminiService';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      text: "DANEYBIL BTC AI online. Awaiting your commands. Zero-mistake protocol active. System is in high-precision mode.",
      timestamp: new Date()
    }
  ]);
  const [stats, setStats] = useState<SystemStats>({
    engineStatus: 'Optimal',
    precisionLevel: 100,
    marketSync: true,
    securityHash: '0xDE...B42',
    activeDeployments: 0,
    strictMode: true,
    audioOutputEnabled: true,
    autoCopyEnabled: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Mandatory API Key check for Gemini 3 models
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success and proceed to the app as per race condition guidelines
      setHasApiKey(true);
    }
  };

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('daneybil_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const formatted = parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(formatted);
      } catch (e) {
        console.error("History parse error", e);
      }
    }
  }, []);

  // Save active session to history
  useEffect(() => {
    if (messages.length > 1) {
      const updatedSessions = [...sessions];
      const index = updatedSessions.findIndex(s => s.id === activeSessionId);
      const sessionData: ChatSession = {
        id: activeSessionId,
        title: messages[1]?.text.slice(0, 30) + '...' || 'New Command Sequence',
        messages: messages,
        timestamp: new Date()
      };

      if (index > -1) {
        updatedSessions[index] = sessionData;
      } else {
        updatedSessions.unshift(sessionData);
      }
      
      const limited = updatedSessions.slice(0, 20); // Keep last 20
      setSessions(limited);
      localStorage.setItem('daneybil_history', JSON.stringify(limited));
    }
  }, [messages, activeSessionId]);

  const handleSendMessage = async (text: string, image?: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      image,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const responseText = await generateDaneybilResponse(text, messages, stats.strictMode, image);
      
      const needsConfirmation = responseText.toLowerCase().includes("do you confirm") || responseText.toLowerCase().includes("please confirm");
      const hasCode = responseText.includes('```');

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        timestamp: new Date(),
        hasCode,
        needsConfirmation
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (stats.audioOutputEnabled) {
        speakResponse(responseText);
      }

      if (stats.autoCopyEnabled && hasCode) {
        const codeBlocks = responseText.match(/```(?:[\w]*\n)?([\s\S]*?)```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          const primaryCode = codeBlocks[0].replace(/```[\w]*\n?/, '').replace(/```$/, '').trim();
          navigator.clipboard.writeText(primaryCode);
        }
      }

    } catch (error: any) {
      console.error("System Error caught in App:", error);
      const errorMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      
      const isAuthError = errorMsg.includes('AUTH_ERROR') || 
                          errorMsg.includes('403') || 
                          errorMsg.includes('permission') || 
                          errorMsg.includes('not found');
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: isAuthError 
          ? "COMMAND REJECTED: Gemini API Authentication Failure (403/404). This version of DANEYBIL AI requires a paid billing project. Please use the button below to connect a valid API key."
          : `COMMAND FAILURE: ${errorMsg.slice(0, 150)}...`,
        timestamp: new Date()
      }]);

      if (isAuthError) {
        setHasApiKey(false); // Trigger the "Credentials Required" UI
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    setActiveSessionId(newId);
    setMessages([{
      id: 'init',
      role: 'assistant',
      text: "New encrypted terminal initialized. Awaiting commands.",
      timestamp: new Date()
    }]);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
    }
  };

  const toggleLiveCall = () => {
    setIsLiveCallActive(!isLiveCallActive);
  };

  const updateStats = (newStats: Partial<SystemStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  return (
    <div className="flex flex-col h-screen bg-black/30 backdrop-blur-sm text-slate-100 selection:bg-blue-500/30">
      <Header 
        isLiveActive={isLiveCallActive} 
        onToggleLive={toggleLiveCall} 
        stats={stats}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {!hasApiKey ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-black/60 backdrop-blur-xl z-[100]">
            <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-wider">Authentication Required</h2>
            <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
              DANEYBIL AI detected a permission error (403). To function on Vercel, you must connect an API key from a <strong>paid Google Cloud project</strong> with billing enabled.
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleOpenKeySelector}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-2xl shadow-blue-500/20 flex items-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>
                CONNECT VALID API KEY
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-slate-500 hover:text-blue-400 underline uppercase tracking-widest"
              >
                Billing Documentation & Setup
              </a>
            </div>
          </div>
        ) : (
          <>
            <main className="flex-1 flex flex-col relative">
              {isLiveCallActive ? (
                <LiveCall onClose={() => setIsLiveCallActive(false)} />
              ) : (
                <CommandCenter 
                  messages={messages} 
                  onSendMessage={handleSendMessage} 
                  isProcessing={isProcessing} 
                  strictMode={stats.strictMode}
                  onToggleStrict={(val) => updateStats({ strictMode: val })}
                />
              )}
            </main>
            
            <aside className="w-80 border-l border-slate-800/50 bg-black/40 backdrop-blur-xl hidden xl:block">
              <Dashboard 
                stats={stats} 
                sessions={sessions}
                activeSessionId={activeSessionId}
                onLoadSession={loadSession}
                onCreateSession={createNewSession}
                onUpdateStats={updateStats}
              />
            </aside>
          </>
        )}
      </div>

      <footer className="h-8 border-t border-slate-800/50 flex items-center justify-between px-6 text-[10px] mono text-slate-500 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> SECURE TUNNEL</span>
          <span>LATENCY: 12ms</span>
          <span>PRECISION: {stats.strictMode ? 'STRICT' : 'ADAPTIVE'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>DANEYBIL ENGINE V1.2.4</span>
          <span>&copy; 2025 COMMAND PROTOCOL X</span>
        </div>
      </footer>
    </div>
  );
};

export default App;