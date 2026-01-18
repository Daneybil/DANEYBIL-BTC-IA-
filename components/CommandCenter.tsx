
import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { speakResponse } from '../services/geminiService';

interface CommandCenterProps {
  messages: Message[];
  onSendMessage: (text: string, image?: string) => void;
  isProcessing: boolean;
  strictMode: boolean;
  onToggleStrict: (val: boolean) => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ messages, onSendMessage, isProcessing, strictMode, onToggleStrict }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        // Keep listening if we didn't explicitly stop
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition start failed", e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !image || isProcessing) return;
    
    // Stop listening if we submit
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    onSendMessage(input, image || undefined);
    setInput('');
    setImage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string) => {
    const codeMatch = text.match(/```(?:[\w]*\n)?([\s\S]*?)```/);
    const contentToCopy = codeMatch ? codeMatch[1].trim() : text;
    navigator.clipboard.writeText(contentToCopy);
  };

  const renderMessageContent = (msg: Message) => {
    const parts = msg.text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const langMatch = part.match(/```([\w]*)/);
        const language = langMatch ? langMatch[1] : '';
        const code = part.replace(/```[\w]*\n?/, '').replace(/```$/, '').trim();
        return (
          <div key={i} className="my-6 relative group border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-black/80">
            <div className="bg-slate-900/50 px-4 py-2 flex justify-between items-center border-b border-white/5">
              <span className="text-[10px] font-bold mono text-slate-400 uppercase tracking-widest">{language || 'CODE'}</span>
              <button 
                onClick={() => copyToClipboard(part)}
                className="text-blue-400 hover:text-blue-300 text-[10px] font-bold flex items-center gap-1.5 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                COPY
              </button>
            </div>
            <pre className="p-6 mono text-xs leading-relaxed text-blue-100/90 overflow-x-auto scrollbar-hide">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return <p key={i} className="whitespace-pre-wrap leading-relaxed mb-2">{part}</p>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="px-8 py-3 border-b border-white/5 bg-black/40 backdrop-blur-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${strictMode ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
            <span className="text-[10px] font-bold mono uppercase text-slate-400 tracking-widest">
              STRICT MODE: {strictMode ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <button 
            onClick={() => onToggleStrict(!strictMode)}
            className={`text-[9px] px-2 py-0.5 rounded border ${strictMode ? 'border-red-900/50 text-red-500' : 'border-slate-700 text-slate-400'} hover:bg-white/5 transition-all`}
          >
            TOGGLE
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mono uppercase tracking-widest">
          <span>Buffer: 100% Verified</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] group`}>
              <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-400' : 'text-slate-500'}`}>
                  {msg.role === 'user' ? 'Commander' : 'DANEYBIL AI'}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.role === 'assistant' && (
                   <button 
                    onClick={() => speakResponse(msg.text)}
                    className="p-1 text-slate-500 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Read Response Aloud"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                   </button>
                )}
              </div>
              
              <div className={`p-6 rounded-2xl transition-all ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20' 
                : 'bg-black/40 border border-white/10 text-slate-200 backdrop-blur-md shadow-xl'
              }`}>
                {msg.image && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-white/10 max-w-sm shadow-2xl">
                    <img src={msg.image} alt="Input source" className="w-full h-auto object-cover" />
                  </div>
                )}
                <div className="text-[15px] font-medium tracking-tight">
                  {renderMessageContent(msg)}
                </div>
                {msg.needsConfirmation && msg.role === 'assistant' && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                    <button 
                      onClick={() => onSendMessage("I CONFIRM THIS COMMAND. EXECUTE.")}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      CONFIRM
                    </button>
                    <button 
                      onClick={() => onSendMessage("CANCEL COMMAND.")}
                      className="px-4 py-2 bg-white/10 text-slate-300 text-xs font-bold rounded-lg hover:bg-white/20 transition-all"
                    >
                      CANCEL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-3 text-blue-500 text-[10px] font-bold mono uppercase tracking-widest">
            <span className="flex gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
            </span>
            DANEYBIL ENGINE SYNCHRONIZING...
          </div>
        )}
      </div>

      <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-2xl">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-4 items-end">
          <div className="flex-1 relative group">
            {image && (
              <div className="absolute bottom-full mb-4 left-0 p-2 bg-black/90 border border-white/10 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                 <div className="relative">
                   <img src={image} className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                   <button 
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-400 transition-colors"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                   </button>
                 </div>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isListening ? "Listening... (System will transcribe as you speak)" : "Enter command (Absolute obedience active)..."}
              className={`w-full bg-black/60 border ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10'} rounded-2xl py-4 pl-5 pr-20 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none scrollbar-hide min-h-[60px] max-h-[200px] shadow-inner`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <button 
                type="button"
                onClick={toggleListening}
                className={`transition-all duration-300 rounded-full p-2 ${isListening ? 'text-red-500 animate-pulse bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-slate-500 hover:text-blue-500'}`}
                title="Voice Input (STT)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </button>
              <button 
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-slate-500 hover:text-blue-500 transition-colors"
                title="Upload Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
            </div>
            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <button 
            type="submit"
            disabled={isProcessing || (!input.trim() && !image)}
            className="h-[60px] px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-700 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center group/btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:-translate-y-1 transition-transform"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommandCenter;
