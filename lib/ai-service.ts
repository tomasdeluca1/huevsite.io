import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const aiService = {
  async rewriteText(text: string) {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Actúa como un copywriter experto en marcas personales para creativos y builders. 
    Reescribe el siguiente texto en 3 versiones distintas:
    1. Professional: Elegante, corporativo pero moderno.
    2. Fun: Divertido, informal, con mucha energía y algún emoji.
    3. Short: Minimalista, conciso, directo al punto.

    Texto original: "${text}"

    Responde únicamente con un objeto JSON con las llaves: "professional", "fun", "short".
    No incluyas explicaciones ni nada fuera del JSON.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const data = JSON.parse(response.text());
      return data;
    } catch (error) {
      console.error("Error in AI rewrite:", error);
      throw new Error("No se pudo procesar la IA en este momento.");
    }
  }
};
