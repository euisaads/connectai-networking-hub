import { GoogleGenAI, Type } from "@google/genai";
import { IcebreakerRequest } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Só cria o client se tiver chave
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Helper for timeout
const timeoutPromise = (ms: number) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

export const generateIcebreaker = async (request: IcebreakerRequest): Promise<string> => {
  try {
    if (!ai) {
      return "Olá! Vi seu perfil e achei sua experiência muito interessante. Gostaria de conectar para acompanhar seu trabalho.";
    }

    const prompt = `
Você é um especialista em networking profissional.
Gere uma mensagem de conexão para o LinkedIn (curta, profissional e amigável, máximo 300 caracteres).

Remetente: ${request.myProfile.name}, Cargo: ${request.myProfile.role}, Área: ${request.myProfile.area}.
Destinatário: ${request.targetProfile.name}, Cargo: ${request.targetProfile.role}, Área: ${request.targetProfile.area}.

A mensagem deve mencionar o interesse na área de ${request.targetProfile.area} e sugerir uma troca de conhecimentos.
Não use hashtags.
`;

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      }),
      timeoutPromise(8000),
    ]);

    return response.text || "Não foi possível gerar a mensagem.";
  } catch (error) {
    console.error("Error generating icebreaker:", error);
    return "Olá! Vi seu perfil e achei sua experiência muito interessante. Gostaria de conectar para acompanhar seu trabalho.";
  }
};

export const enhanceProfileData = async (role: string, area: string) => {
  const fallback = {
    normalizedRole: role,
    normalizedArea: area,
    bio: `${role} atuando na área de ${area}.`,
    tags: [area, "Networking"],
  };

  if (!ai) return fallback;

  try {
    const prompt = `
Analise os dados deste profissional:
Cargo Entrada: "${role}"
Área Entrada: "${area}"

Tarefas:
1. Normalize o Cargo (ex: "Ger Prod" -> "Gerente de Produto").
2. Normalize a Área (ex: "Mkt" -> "Marketing").
3. Crie uma Bio curta de impacto (max 120 caracteres).
4. Gere 3 Tags técnicas/profissionais relevantes.
`;

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
      timeoutPromise(6000),
    ]);

    const text = response.text;
    if (!text) return fallback;

    const data = JSON.parse(text);

    return {
      normalizedRole: data.normalizedRole || role,
      normalizedArea: data.normalizedArea || area,
      bio: data.bio || fallback.bio,
      tags: data.tags || fallback.tags,
    };
  } catch (error) {
    console.error("Error enhancing profile:", error);
    return fallback;
  }
};
