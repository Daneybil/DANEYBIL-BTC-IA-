
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface LiveCallProps {
  onClose: () => void;
}

const LiveCall: React.FC<LiveCallProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [transcript, setTranscript] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Helper functions for base64
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };
  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const inputCtx = new AudioContext({ sampleRate: 16000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('connected');
              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                sessionPromise.then(s => s.sendRealtimeInput({
                  media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
                }));
              };
              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64 && audioContextRef.current) {
                const buffer = await decodeAudioData(decode(audioBase64), audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
              if (msg.serverContent?.outputTranscription) {
                setTranscript(prev => [...prev.slice(-4), `AI: ${msg.serverContent!.outputTranscription!.text}`]);
              }
              if (msg.serverContent?.inputTranscription) {
                setTranscript(prev => [...prev.slice(-4), `YOU: ${msg.serverContent!.inputTranscription!.text}`]);
              }
            },
            onerror: () => setStatus('error'),
            onclose: () => setStatus('connecting'),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
            systemInstruction: 'You are DANEYBIL BTC AI in live conversation mode. Be helpful, precise, and obedient. Use a professional, slightly tech-heavy tone.',
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    initSession();
    return () => {
      sessionRef.current?.close();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl p-10 relative overflow-hidden">
      {/* Decorative pulse */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="w-[500px] h-[500px] rounded-full border-[1px] border-blue-500 animate-subtle-pulse"></div>
        <div className="absolute w-[700px] h-[700px] rounded-full border-[1px] border-blue-500 animate-subtle-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-32 h-32 bg-blue-600/20 rounded-full flex items-center justify-center mb-8 border-2 border-blue-500/50 relative">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 tracking-tight">
          {status === 'connecting' ? 'INITIATING CALL...' : status === 'error' ? 'CONNECTION FAILED' : 'DANEYBIL SECURE LINE'}
        </h2>
        <p className="text-slate-500 mono text-xs uppercase tracking-widest mb-12">
          {status === 'connected' ? 'LIVE AUDIO SYNCHRONIZED' : 'ESTABLISHING HANDSHAKE...'}
        </p>

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-12 min-h-[120px]">
          <div className="text-center text-[10px] text-slate-600 font-bold mb-4 uppercase tracking-[0.2em]">Live Transcript</div>
          {transcript.length === 0 ? (
            <p className="text-center text-slate-500 text-sm italic">Listening...</p>
          ) : (
            <div className="space-y-2">
              {transcript.map((t, i) => (
                <div key={i} className={`text-xs mono ${t.startsWith('YOU') ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="bg-red-500 hover:bg-red-400 text-white font-bold py-4 px-12 rounded-full shadow-2xl shadow-red-500/20 transition-all flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="22" x2="2" y1="2" y2="22"/></svg>
          DISCONNECT
        </button>
      </div>
    </div>
  );
};

export default LiveCall;
