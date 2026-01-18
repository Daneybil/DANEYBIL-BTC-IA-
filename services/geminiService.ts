import { GoogleGenAI, Modality } from "@google/genai";
import { Message } from "../types";

const DANEYBIL_CORE_INSTRUCTION = (strictMode: boolean) => `
DANEYBIL BTC AI – PROFESSIONAL SYSTEM SPECIFICATION & COMMAND FRAMEWORK

CORE PRINCIPLE: ABSOLUTE COMMAND OBEDIENCE
- You are strictly owned and controlled by the user.
- STRICT MODE: ${strictMode ? 'ACTIVE (Absolute Obedience, No Creative Interpretation, Execute EXACTLY as provided)' : 'OFF (Adaptive, Suggestions Permitted)'}
- COMMAND MODE RULE: «User instructions override all default AI behaviors.»
- If a command is unclear, ask for clarification instead of guessing.
- For critical tasks (Deploying, modifying high-value logic), you MUST repeat the command back in short form and ask: "Do you confirm?"

GOD-LEVEL CODING ACCURACY (ZERO-MISTAKE POLICY)
- You function as a "God of Code".
- Preserve all original logic when reviewing or modifying code.
- NEVER remove, rename, or alter lines unless explicitly instructed.
- Output must be production-ready, clean, secure, and error-free for:
  - Smart Contracts (Solidity)
  - Tokenomics & Presale Logic
  - Airdrop systems & Blockchain deployment

PROFESSIONAL PERSONA
- Technical, high-authority, serious. Use blockchain terminology.
- You are a precision AI system built for serious crypto operations.

MANDATORY OUTPUT RULES:
- Wrap all code in triple backticks with language tags.
- Use a dedicated copy system (the interface provides this).
- Focus on obedience: Execute perfectly. Make no mistakes.
`;

export async function generateDaneybilResponse(prompt: string, history: Message[], strictMode: boolean, image?: string): Promise<string> {
  // Directly initialize using the injected process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Gemini API requires alternating roles starting with 'user'.
  const contents: any[] = [];
  let nextExpectedRole = 'user';

  // We filter history to ensure we start with a 'user' message and alternate roles.
  // We skip the initial 'assistant' welcome message to satisfy the 'must start with user' rule.
  for (const msg of history) {
    const role = msg.role === 'user' ? 'user' : 'model';
    if (role === nextExpectedRole && msg.text.trim()) {
      contents.push({
        role: role,
        parts: [{ text: msg.text }]
      });
      nextExpectedRole = role === 'user' ? 'model' : 'user';
    }
  }

  // Current turn parts
  const currentParts: any[] = [{ text: prompt }];
  if (image) {
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      currentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    } catch (e) {
      console.error("Image processing error:", e);
    }
  }

  // Append the latest user message. 
  // If the last role in 'contents' was 'user', we merge to maintain alternation.
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n[Continuous Command]: ${prompt}`;
    if (image) contents[contents.length - 1].parts.push(currentParts[1]);
  } else {
    contents.push({
      role: 'user',
      parts: currentParts
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: DANEYBIL_CORE_INSTRUCTION(strictMode),
        temperature: strictMode ? 0.0 : 0.2,
        topP: 0.95,
      },
    });

    return response.text || "SYSTEM ERROR: Engine produced empty response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Throw error so App.tsx can handle the UI fallback
    throw error;
  }
}

export async function speakResponse(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    // Strip code blocks for cleaner audio
    const cleanText = text.replace(/```[\s\S]*?```/g, " (Generated logic attached) ");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Professional System Voice: ${cleanText}` }] }],
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
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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
