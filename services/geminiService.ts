import { GoogleGenAI, Type } from "@google/genai";
import { Card, Mnemonic } from '../types';

// Helper for environments where crypto.randomUUID might be undefined
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getAI = () => {
    // Check if key exists. In a real environment, process.env.API_KEY is injected.
    const apiKey = process.env.API_KEY; 
    if (!apiKey) {
        // If no API key, we return a mock or throw. 
        // For the preview, we'll alert if called.
        console.warn("API Key missing");
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

export const generateMnemonic = async (front: string, back: string, context: string = ""): Promise<Mnemonic> => {
    try {
        const ai = getAI();
        if (!ai) throw new Error("No API Key");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a memorable, funny, or vivid mnemonic to help remember that "${front}" means "${back}". ${context} Keep it short.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mnemonic: { type: Type.STRING }
                    }
                }
            }
        });
        
        const text = response.text ? JSON.parse(response.text).mnemonic : "Failed to generate";
        
        return {
            id: generateId(),
            text: text,
            votes: 0,
            isAiGenerated: true
        };

    } catch (error) {
        console.error("AI Error:", error);
        return { id: generateId(), text: "AI Unavailable (Check API Key)", votes: 0, isAiGenerated: true };
    }
};

export const extractVocabFromText = async (text: string, knownWords: string[]): Promise<Array<{front: string, back: string, pos: string}>> => {
    try {
        const ai = getAI();
        if (!ai) throw new Error("No API Key");

        // Limit known words context to avoid token limits
        const knownContext = knownWords.slice(0, 100).join(", ");
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the following text. Extract up to 10 key vocabulary words or phrases. 
            Do NOT include these words: [${knownContext}].
            Provide the word in the original language (front), English translation (back), and part of speech.
            
            Text: "${text.substring(0, 2000)}"`,
             config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            front: { type: Type.STRING },
                            back: { type: Type.STRING },
                            pos: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        return response.text ? JSON.parse(response.text) : [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const generateMathProblem = async (): Promise<{problem: string, answer: string}> => {
    try {
        const ai = getAI();
        if (!ai) {
             const n1 = Math.floor(Math.random() * 10);
             const n2 = Math.floor(Math.random() * 10);
             return { problem: `${n1} + ${n2}`, answer: `${n1+n2}` };
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a random math problem suitable for mental math (e.g., simple algebra, percentages, or arithmetic). Return the problem statement and the numeric answer.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        problem: { type: Type.STRING },
                        answer: { type: Type.STRING }
                    }
                }
            }
        });
         return response.text ? JSON.parse(response.text) : { problem: "1+1", answer: "2"};
    } catch (e) {
        const n1 = Math.floor(Math.random() * 10);
        const n2 = Math.floor(Math.random() * 10);
        return { problem: `${n1} + ${n2}`, answer: `${n1+n2}` };
    }
}
