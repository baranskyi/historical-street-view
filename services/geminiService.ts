import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
  
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROMPT = `Imagine a camera positioned exactly at the tail of the arrow on the map, pointing directly towards the arrowhead. Generate a hyper-realistic, photorealistic, 3D, first-person street-level view from this precise location and direction. The generated image must strictly adhere to the historical period, atmosphere, and universe depicted in the map. Use the map's style, labels, and illustrations as critical clues to inform the architecture, technology, clothing, and overall environment of the scene, ensuring the final image looks like a real-world photograph from within that specific world.`;

function base64ToInlineData(base64String: string): { mimeType: string; data: string } {
    const match = base64String.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid base64 string format");
    }
    const mimeType = match[1];
    const data = match[2];
    return { mimeType, data };
}


export const generateStreetView = async (mergedImageBase64: string): Promise<string | null> => {
    try {
        const { mimeType, data } = base64ToInlineData(mergedImageBase64);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data, mimeType } },
                    { text: PROMPT },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                return imageUrl;
            }
        }
        return null; // No image part found in response
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the Gemini API.");
    }
};