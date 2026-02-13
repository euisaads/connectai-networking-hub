import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠ GEMINI_API_KEY not set in Vercel Environment Variables.");
}

const createAI = () => new GoogleGenAI({ apiKey: API_KEY! });

function buildEnhancePrompt(role: string, area: string, linkedinAbout?: string) {
  return `
Você é um especialista em branding profissional no Brasil (pt-BR).

Entrada:
- Cargo: "${role}"
- Área: "${area}"
${linkedinAbout ? `- LinkedIn Sobre: "${linkedinAbout}"` : ""}

Sua tarefa:
1. Normalizar o cargo para versão profissional por extenso.
2. Normalizar a área (ex: "Cursando T.I" → "Tecnologia da Informação").
3. Criar uma bio curta (máx 120 caracteres), específica e profissional.
4. Criar exatamente 3 tags iniciando com #, curtas e relevantes.

Regras importantes:
- Evitar frases genéricas como "focado em resultados".
- Se houver indício de transição de carreira, mencionar isso.
- Tags devem ser técnicas ou estratégicas.

Exemplo esperado:
Entrada:
Cargo="Cursando T.I"
Área="Cursando T.I"

Saída JSON:
{
  "normalizedRole": "Estudante / Cursando T.I",
  "normalizedArea": "Tecnologia da Informação",
  "bio": "Especialista em BPO focado em otimização de processos e em transição para o setor de Tecnologia da Informação.",
  "tags": ["#BPO", "#Processos", "#TI"]
}

Retorne apenas JSON válido.
`.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const { role, area, linkedinAbout } = req.body ?? {};

    if (!role || !area) {
      return res.status(400).json({ error: "Missing role or area" });
    }

    const ai = createAI();
    const prompt = buildEnhancePrompt(role, area, linkedinAbout);

    const response: any = await ai.models.generateContent({
      model: "gemini-3.2-mini",
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            normalizedRole: { type: Type.STRING },
            normalizedArea: { type: Type.STRING },
            bio: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["normalizedRole", "normalizedArea", "bio", "tags"]
        }
      }
    });

    return res.status(200).json({ text: response?.text ?? "" });

  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
