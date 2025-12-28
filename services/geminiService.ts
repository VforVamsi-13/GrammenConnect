
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { getFromCache, saveToCache } from "./cacheService";

const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English', 'hi': 'Hindi', 'bn': 'Bengali', 'te': 'Telugu', 'mr': 'Marathi', 
  'ta': 'Tamil', 'ur': 'Urdu', 'gu': 'Gujarati', 'kn': 'Kannada', 'ml': 'Malayalam', 
  'pa': 'Punjabi', 'or': 'Odia', 'as': 'Assamese'
};

const getLanguageInstruction = (lang: string) => {
  const langName = LANGUAGE_MAP[lang] || 'English';
  if (lang === 'en') return "";
  return ` MANDATORY: You must write EVERYTHING strictly in the ${langName} language and using the ${langName} script. Do not use English words unless absolutely necessary.`;
};

const extractJson = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", text);
    return {};
  }
};

/**
 * Generic retry wrapper for AI operations to handle transient network issues.
 */
const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isRetryable = errorMsg.includes("failed to fetch") || errorMsg.includes("network") || errorMsg.includes("429") || errorMsg.includes("quota");
    
    if (retries > 0 && isRetryable) {
      console.warn(`AI request failed, retrying in ${delay}ms...`, errorMsg);
      await new Promise(r => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const handleApiError = (error: any): string => {
  console.error("Gemini API Connection Error:", error);
  const errorMsg = error instanceof Error ? error.message : String(error);
  const lowMessage = errorMsg.toLowerCase();
  
  if (lowMessage.includes("failed to fetch") || lowMessage.includes("networkerror") || lowMessage.includes("load failed")) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return "You appear to be offline. Please check your internet connection.";
    }
    return "Connection Lost: Unable to reach the AI. Please check your internet or disable ad-blockers.";
  }
  
  if (lowMessage.includes("429") || lowMessage.includes("quota") || lowMessage.includes("limit")) {
    return "The assistant is busy. Please wait a minute and try again.";
  }

  return "I'm having trouble connecting to the AI. Please try again soon.";
};

const getAiClient = () => {
  if (!process.env.API_KEY) throw new Error("API Key Missing");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the precise latitude and longitude for the location: "${location}, India". Provide only the JSON with keys 'lat' and 'lng'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["lat", "lng"]
        }
      }
    }));
    return extractJson(response.text || '{}');
  } catch (e) {
    return null;
  }
};

export const generateContent = async (prompt: string, language: string = 'en', systemInstruction?: string): Promise<string> => {
  const cacheKey = `${language}_${prompt}_${systemInstruction || ''}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        systemInstruction: (systemInstruction || '') + getLanguageInstruction(language) 
      }
    }));
    
    const text = response.text || "";
    if (text) saveToCache(cacheKey, text);
    return text;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getMobilityPlan = async (
  start: string, 
  end: string, 
  aid: string, 
  language: string
): Promise<{ text: string; links: { title: string; uri: string }[] }> => {
  try {
    const ai = getAiClient();
    const langName = LANGUAGE_MAP[language] || 'English';
    
    let latLng = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
      );
      latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) { }

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Plan a safe and accessible route for a person using a "${aid}" from "${start}" to "${end}". Provide real-time data using Google Maps tools. Explain accessibility features, road conditions, and public transport options. Answer in ${langName}.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng } },
        systemInstruction: `You are an Expert Indian Accessibility and Mobility Consultant. ${getLanguageInstruction(language)} Provide detailed, safe, and helpful directions.`
      },
    }));

    const text = response.text || "";
    const links: { title: string; uri: string }[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.maps?.uri) links.push({ title: chunk.maps.title || "View on Maps", uri: chunk.maps.uri });
    });

    return { text, links };
  } catch (error) {
    return { text: handleApiError(error), links: [] };
  }
};

export const extractMobilityDetails = async (speech: string, language: string): Promise<{ start: string; end: string; aid: string }> => {
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract the following details from this speech: "${speech}". I need the start location, destination location, and any mobility aid mentioned (choose from: Wheelchair, Walking Stick, Crutches, None).`,
      config: {
        systemInstruction: "You are a data extractor. Extract 'start', 'end', and 'aid'. Output strictly as JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            start: { type: Type.STRING },
            end: { type: Type.STRING },
            aid: { type: Type.STRING }
          },
          required: ["start", "end", "aid"]
        }
      }
    }));
    return extractJson(response.text || '{}');
  } catch {
    return { start: "", end: "", aid: "None" };
  }
};

export const extractResumeDetails = async (speech: string, language: string): Promise<{ name: string; location: string; skills: string; experience: string; education: string }> => {
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract the following details from this user description for a resume: "${speech}". Need name, location, skills, work experience, and education.`,
      config: {
        systemInstruction: "You are a professional resume data extractor. Output JSON with fields: name, location, skills, experience, education.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            location: { type: Type.STRING },
            skills: { type: Type.STRING },
            experience: { type: Type.STRING },
            education: { type: Type.STRING }
          },
          required: ["name", "location", "skills", "experience", "education"]
        }
      }
    }));
    return extractJson(response.text || '{}');
  } catch {
    return { name: "", location: "", skills: "", experience: "", education: "" };
  }
};

export const extractSchemeDetails = async (speech: string, language: string): Promise<{ age: string; gender: string; occupation: string; income: string; state: string }> => {
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract the following demographic profile details from this speech: "${speech}". Need age, gender, occupation, annual income, and state.`,
      config: {
        systemInstruction: "Extract user profile details for government scheme matching. Output JSON with fields: age, gender, occupation, income, state.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            age: { type: Type.STRING },
            gender: { type: Type.STRING },
            occupation: { type: Type.STRING },
            income: { type: Type.STRING },
            state: { type: Type.STRING }
          },
          required: ["age", "gender", "occupation", "income", "state"]
        }
      }
    }));
    return extractJson(response.text || '{}');
  } catch {
    return { age: "", gender: "Male", occupation: "", income: "", state: "" };
  }
};

export const extractMandiItem = async (speech: string, language: string): Promise<{ name: string; price: string; contact: string; location: string }> => {
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract agricultural item listing details from this speech: "${speech}". Need item name, expected price, contact phone, and location.`,
      config: {
        systemInstruction: "Extract agricultural mandi listing info. Output JSON with fields: name, price, contact, location.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.STRING },
            contact: { type: Type.STRING },
            location: { type: Type.STRING }
          },
          required: ["name", "price", "contact", "location"]
        }
      }
    }));
    return extractJson(response.text || '{}');
  } catch {
    return { name: "", price: "", contact: "", location: "" };
  }
};

export const recognizeSahayakIntent = async (userInput: string, languageCode: string): Promise<any> => {
  try {
    const ai = getAiClient();
    const langName = LANGUAGE_MAP[languageCode] || 'English';
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Interpret the user's intent: "${userInput}". Determine if they want to navigate the app, report health symptoms, plan a trip, or search schemes.`,
      config: { 
        systemInstruction: `You are SAHAYAK AI, a smart intent recognizer. Analyze the input and return JSON with keys: 'action' (navigate, type_health_input, plan_mobility, search_schemes), 'target' (kisan_mandi, swasthya_saathi, resume_builder, mobility_planner, schemes, vision_helper), and a friendly confirmation 'text' in ${langName}.`,
        responseMimeType: "application/json" 
      }
    }));
    return extractJson(response.text || '{}');
  } catch (e) {
    return { action: "unknown", text: handleApiError(e) };
  }
};

export const generateVisionContent = async (
  prompt: string, 
  base64Image: string, 
  mimeType: string, 
  language: string = 'en',
  skipLanguageInstruction: boolean = false
): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType, data: base64Image } }, { text: prompt }] },
      config: { systemInstruction: skipLanguageInstruction ? "Vision analysis assistant." : `Visual aid assistant for rural Indian users. ${getLanguageInstruction(language)}` }
    }));
    return response.text || "";
  } catch (error) { 
    return handleApiError(error); 
  }
};

export const chatWithBot = async (history: any[], message: string, systemInstruction: string, language: string = 'en') => {
  try {
    const ai = getAiClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction: systemInstruction + getLanguageInstruction(language), temperature: 0.7 },
      history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] }))
    });
    const result = await withRetry<GenerateContentResponse>(() => chat.sendMessage({ message }));
    return result.text || "";
  } catch (e: any) { 
    return handleApiError(e); 
  }
};

export const transliterateText = async (text: string, targetLang: string): Promise<string> => {
  if (!text || targetLang === 'en') return text;
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transliterate the following English/Hinglish text into the ${LANGUAGE_MAP[targetLang]} script: "${text}"`,
      config: { systemInstruction: "Output ONLY the transliterated script text. No English." }
    }));
    return response.text?.trim() || text;
  } catch { 
    return text; 
  }
};
