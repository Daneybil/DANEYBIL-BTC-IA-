
import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';

interface TerminalProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full mono">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-400' : 'text-cyan-500'}`}>
                  {msg.role === 'user' ? 'User@Client' : 'Omega@VM'}
                </span>
                <span className="text-[9px] text-zinc-600">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`max-w-[90%] p-3 rounded-md border shadow-inner ${
                msg.role === 'user' 
                ? 'bg-blue-900/10 border-blue-900/30 text-blue-100' 
                : 'bg-cyan-900/5 border-cyan-900/20 text-cyan-50'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {msg.text}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-cyan-600 animate-pulse text-xs italic">
            <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
            <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
            <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
            <span>Omega is calculating transcendence...</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-cyan-950/5 border-t border-cyan-900/20">
        <form onSubmit={handleSubmit} className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 font-bold">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Type command or message to Omega..."
            className="w-full bg-black/40 border border-cyan-900/40 rounded-lg py-3 pl-10 pr-4 text-cyan-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-cyan-900"
          />
          <button 
            type="submit"
            disabled={isTyping || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold px-4 py-1.5 rounded text-xs transition-colors"
          >
            EXECUTE
          </button>
        </form>
      </div>
    </div>
  );
};

export default Terminal;
