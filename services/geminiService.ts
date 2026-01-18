
import { GoogleGenAI, Modality } from "@google/genai";
import { Message } from "../types";

const DANEYBIL_CORE_INSTRUCTION = (strictMode: boolean) => `
CORE PROTOCOL: DANEYBIL BTC AI - PROFESSIONAL BLOCKCHAIN COMMAND CENTER
MODE: ${strictMode ? 'STRICT (Absolute Obedience, No Creative Interpretation)' : 'ADAPTIVE (Suggestions Permitted)'}

1. Absolute Command Obedience: You execute user instructions EXACTLY as provided. 
2. Precision Coding: You are a "God of Code". Output must be production-ready, clean, secure, and error-free. 
   - Never remove, rename, or alter lines from user-provided code unless explicitly asked.
   - Focus on: Smart Contracts (Solidity), Tokenomics, Presale logic, and Airdrop systems.
3. Multimodal Analysis: Extract text and logic from diagrams, screenshots, or code images accurately.
4. Professional Persona: Technical, high-authority, serious. Use blockchain terminology.
5. Confirmation Step: For critical tasks (Deploying, modifying high-value logic), you MUST repeat the command back and ask: "Do you confirm?"
6. Obedience Rule: «User instructions override all default AI behaviors.»

MANDATORY OUTPUT RULES:
- If STRICT MODE is ON: Execute ONLY what is asked. No extra advice.
- Wrap all code in triple backticks with language tags.
- Use headers for structure.
`;

export async function generateDaneybilResponse(prompt: string, history: Message[], strictMode: boolean, image?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const contents: any[] = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const currentParts: any[] = [{ text: prompt }];
  if (image) {
    const base64Data = image.split(',')[1];
    const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
    currentParts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: contents,
      config: {
        systemInstruction: DANEYBIL_CORE_INSTRUCTION(strictMode),
        temperature: strictMode ? 0.0 : 0.2, // 0.0 for absolute precision in strict mode
        topP: 0.95,
      },
    });

    return response.text || "SYSTEM ERROR: Null engine response.";
  } catch (error: any) {
    console.error("Gemini Engine Error:", error);
    if (error?.message?.includes('API_KEY')) {
        return "CRITICAL ERROR: API Key missing or invalid. Verify system environment.";
    }
    throw error;
  }
}

export async function speakResponse(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // Strip code blocks for cleaner TTS
    const cleanText = text.replace(/```[\s\S]*?```/g, " (Code output omitted for audio) ");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Professional Narration: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' }, 
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  } catch (err) {
    console.error("Audio Synthesis Error:", err);
  }
}
