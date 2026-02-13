import { IcebreakerRequest } from "../types";

const timeout = (ms: number) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

export async function generateIcebreaker(req: IcebreakerRequest): Promise<string> {
  const fallback =
    "Olá! Vi seu perfil e achei sua experiência muito interessante. Gostaria de conectar para trocar ideias.";

  try {
    const r = await Promise.race([
      fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "icebreaker", payload: req }),
      }),
      timeout(12000),
    ]);

    const data = await (r as Response).json();
    return (data?.text && String(data.text).trim()) ? String(data.text).trim() : fallback;
  } catch {
    return fallback;
  }
}

export async function enhanceProfileData(role: string, area: string) {
  const fallback = {
    normalizedRole: role,
    normalizedArea: area,
    bio: `${role} atuando na área de ${area}.`,
    tags: [area, "Networking"],
  };

  try {
    const r = await Promise.race([
      fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "enhance", payload: { role, area } }),
      }),
      timeout(12000),
    ]);

    const data = await (r as Response).json();
    if (!data?.text) return fallback;

    const parsed = JSON.parse(data.text);
    return {
      normalizedRole: parsed.normalizedRole || role,
      normalizedArea: parsed.normalizedArea || area,
      bio: parsed.bio || fallback.bio,
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallback.tags,
    };
  } catch {
    return fallback;
  }
}
