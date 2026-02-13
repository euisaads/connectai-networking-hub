import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { kind, payload } = req.body ?? {};
    if (!kind) return res.status(400).json({ error: "Missing kind" });

    const ai = new GoogleGenAI({ apiKey });

    if (kind === "icebreaker") {
      const { myProfile, targetProfile } = payload;

      const prompt = buildIcebreakerPrompt(myProfile, targetProfile);

      const response: any = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.9,
        },
      });

      return res.status(200).json({ text: response?.text ?? "" });
    }

    if (kind === "enhance") {
      const { role, area } = payload;

      const prompt = buildEnhancePrompt(role, area);

      const response: any = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.8,
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
      });

      return res.status(200).json({ text: response?.text ?? "" });
    }

    return res.status(400).json({ error: "Invalid kind" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}

function buildIcebreakerPrompt(my: any, target: any) {
  return `
Você é especialista em networking no LinkedIn.
Escreva UMA mensagem curta (até 300 caracteres), profissional, sem emojis e sem hashtags.

Meu perfil:
- Nome: ${my?.name}
- Cargo: ${my?.role}
- Área: ${my?.area}

Perfil da pessoa:
- Nome: ${target?.name}
- Cargo: ${target?.role}
- Área: ${target?.area}

Regras:
- citar 1 ponto em comum (área ou cargo)
- convidar para trocar experiências
- terminar com uma pergunta simples
`.trim();
}

function buildEnhancePrompt(role: string, area: string) {
  return `
Você é um consultor de carreira e branding profissional.
Sua tarefa é refinar cargo/área e criar um resumo mais específico.

Entrada:
- Cargo: "${role}"
- Área: "${area}"

Saída JSON (obrigatório):
- normalizedRole: cargo por extenso e padronizado (pt-BR)
- normalizedArea: área padronizada (pt-BR)
- bio: 1 frase forte e específica (até 120 caracteres), evitando genérico como "focado em resultados"
- tags: 3 a 5 tags com # (ex: "#BPO", "#GestãoDeProcessos"), sem repetir a área literalmente

Exemplos de bom nível (NÃO copie, só use como referência):
- bio: "Analista de BPO otimizando processos e automatizando rotinas para eficiência operacional."
- tags: ["#BPO", "#GestãoDeProcessos", "#MelhoriaContínua", "#Automação"]

Agora gere a saída.
`.trim();
}
