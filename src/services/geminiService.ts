// src/services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { IcebreakerRequest } from "../types";

/**
 * Use Vite env var: VITE_GEMINI_API_KEY
 * - Set this in Vercel: Settings > Environment Variables
 * - Name MUST start with VITE_ for import.meta.env to expose it in the browser
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Only instantiate client when key exists (prevents runtime crash)
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Timeouts (ms)
const ICEBREAKER_TIMEOUT = 8000;
const ENHANCE_TIMEOUT = 6000;

const timeoutPromise = (ms: number) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

function safeJsonParse<T = any>(text?: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn("geminiService: JSON parse failed:", e, text?.slice?.(0, 200));
    return null;
  }
}

/** Generate a short, LinkedIn-ready icebreaker string. */
export const generateIcebreaker = async (request: IcebreakerRequest): Promise<string> => {
  const fallback = `Olá ${request.targetProfile.name}, vi seu perfil e achei sua experiência em ${request.targetProfile.area} muito interessante. Gostaria de conectar para trocar ideias.`;

  console.log("geminiService: generateIcebreaker - API key present?", !!API_KEY);

  if (!ai) {
    console.warn("geminiService: AI client not configured; returning fallback icebreaker.");
    return fallback;
  }

  const prompt = `
Você é um especialista em networking profissional.
Gere uma mensagem de conexão para o LinkedIn (curta, profissional e amigável, máximo 300 caracteres).

Remetente: ${request.myProfile.name}, Cargo: ${request.myProfile.role}, Área: ${request.myProfile.area}.
Destinatário: ${request.targetProfile.name}, Cargo: ${request.targetProfile.role}, Área: ${request.targetProfile.area}.

A mensagem deve mencionar o interesse na área de ${request.targetProfile.area} e sugerir uma troca de conhecimentos.
Não use hashtags.
`.trim();

  try {
    const response: any = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      }),
      timeoutPromise(ICEBREAKER_TIMEOUT),
    ]);

    const text = response?.text;
    if (typeof text === "string" && text.trim().length > 0) {
      return text.trim().slice(0, 300);
    }
    return fallback;
  } catch (err) {
    console.error("geminiService: generateIcebreaker error:", err);
    return fallback;
  }
};

/** Enhance profile: normalize role/area, create bio, generate tags. */
export const enhanceProfileData = async (
  role: string,
  area: string
): Promise<{ normalizedRole: string; normalizedArea: string; bio: string; tags: string[] }> => {
  const fallback = {
    normalizedRole: role,
    normalizedArea: area,
    bio: `${role} atuando na área de ${area}.`,
    tags: [area, "Networking"],
  };

  console.log("geminiService: enhanceProfileData - API key present?", !!API_KEY);
  if (!ai) {
    console.warn("geminiService: AI client not configured; returning fallback metadata.");
    return fallback;
  }

  const prompt = `
Analise os dados deste profissional:
Cargo Entrada: "${role}"
Área Entrada: "${area}"

Tarefas:
1) Normalize o Cargo (ex: "Ger Prod" -> "Gerente de Produto").
2) Normalize a Área (ex: "Mkt" -> "Marketing").
3) Crie uma Bio curta de impacto (máx 120 caracteres).
4) Gere 3 Tags técnicas/profissionais relevantes (array de strings).

Retorne um JSON com as chaves: normalizedRole, normalizedArea, bio, tags.
Exemplo de saída:
{"normalizedRole":"Gerente de Produto","normalizedArea":"Produto","bio":"Gerente de Produto focado em ...","tags":["produto","agile","gestão"]}
`.trim();

  try {
    const response: any = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              normalizedRole: { type: Type.STRING },
              normalizedArea: { type: Type.STRING },
              bio: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["normalizedRole", "normalizedArea", "bio", "tags"],
          },
        },
      }),
      timeoutPromise(ENHANCE_TIMEOUT),
    ]);

    // SDK may return text with JSON or structured content; attempt safe parse first
    const parsed = safeJsonParse<{ normalizedRole?: string; normalizedArea?: string; bio?: string; tags?: string[] }>(response?.text);

    if (parsed) {
      return {
        normalizedRole: parsed.normalizedRole || role,
        normalizedArea: parsed.normalizedArea || area,
        bio: parsed.bio || fallback.bio,
        tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags : fallback.tags,
      };
    }

    // Some SDK variants may provide structured data in response.content / response.data
    if (response?.content && typeof response.content === "object") {
      const dataObj = response.content;
      return {
        normalizedRole: dataObj.normalizedRole || role,
        normalizedArea: dataObj.normalizedArea || area,
        bio: dataObj.bio || fallback.bio,
        tags: Array.isArray(dataObj.tags) && dataObj.tags.length ? dataObj.tags : fallback.tags,
      };
    }

    return fallback;
  } catch (err) {
    console.error("geminiService: enhanceProfileData error:", err);
    return fallback;
  }
};
