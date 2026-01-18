
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

      // Handle Audio Output Feature
      if (stats.audioOutputEnabled) {
        speakResponse(responseText);
      }

      // Handle Auto-Copy Feature
      if (stats.autoCopyEnabled && hasCode) {
        // More robust extraction that handles potential text around multiple blocks
        const codeBlocks = responseText.match(/```(?:[\w]*\n)?([\s\S]*?)```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          // Join multiple code blocks or just copy the most relevant first one
          const primaryCode = codeBlocks[0].replace(/```[\w]*\n?/, '').replace(/```$/, '').trim();
          navigator.clipboard.writeText(primaryCode).then(() => {
            console.log("DANEYBIL: Command logic auto-copied to clipboard.");
          });
        }
      }

    } catch (error) {
      console.error("System Error:", error);
      setMessages(prev => [...prev, {
        id: 'err',
        role: 'assistant',
        text: "COMMAND FAILURE: Critical exception encountered. Resetting precision buffers. Please re-issue command.",
        timestamp: new Date()
      }]);
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
