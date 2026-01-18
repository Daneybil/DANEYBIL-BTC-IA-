
import React, { useState, useEffect, useRef } from 'react';
import { Message, SystemStats } from './types';
import CommandCenter from './components/CommandCenter';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import LiveCall from './components/LiveCall';
import { generateDaneybilResponse, speakResponse } from './services/geminiService';

const App: React.FC = () => {
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
    strictMode: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);

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
      
      // Check if response asks for confirmation
      const needsConfirmation = responseText.toLowerCase().includes("do you confirm") || responseText.toLowerCase().includes("please confirm");

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        timestamp: new Date(),
        hasCode: responseText.includes('```'),
        needsConfirmation: needsConfirmation
      };
      setMessages(prev => [...prev, assistantMsg]);
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

  const toggleLiveCall = () => {
    setIsLiveCallActive(!isLiveCallActive);
  };

  const setStrictMode = (val: boolean) => {
    setStats(prev => ({ ...prev, strictMode: val }));
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
              onToggleStrict={setStrictMode}
            />
          )}
        </main>
        
        <aside className="w-80 border-l border-slate-800/50 bg-black/40 backdrop-blur-xl hidden xl:block">
          <Dashboard stats={stats} />
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
