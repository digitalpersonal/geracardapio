
import { GoogleGenAI } from "@google/genai";
import { CreativeData, GeneratedContent, ImageRefinement } from "../types";

export const generateMarmitaContent = async (data: CreativeData): Promise<GeneratedContent> => {
  const [imageResult, textResult] = await Promise.all([
    generateImage(data),
    generateCaption(data)
  ]);

  return {
    imageUrl: imageResult,
    caption: textResult
  };
};

export const regenerateCreativeImage = async (data: CreativeData, refinement: ImageRefinement): Promise<string> => {
  return generateImage(data, refinement);
};

const generateImage = async (data: CreativeData, refinement?: ImageRefinement): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (data.customImage) {
    return data.customImage;
  }

  try {
    let styleKeywords = "";
    switch (data.artStyle) {
      case 'Minimalista': styleKeywords = "Minimalist photography, clean white background, soft shadows, high key lighting, sophisticated, Apple-style advertising."; break;
      case 'Luxo': styleKeywords = "Luxury food photography, dark moody background, golden lighting accents, elegant composition, high-end restaurant look."; break;
      case 'Vibrante': styleKeywords = "Pop art colors, high contrast, vivid saturation, energetic food plating, bright commercial lighting."; break;
      case 'Rustico': styleKeywords = "Rustic wooden table, natural sunlight, organic textures, farm-to-table aesthetic, warm atmosphere."; break;
      case 'Neon': styleKeywords = "Cyberpunk food art, neon lighting, dark background, futuristic glow, vibrant urban vibe."; break;
      case 'Ilustracao': styleKeywords = "3D Pixar style food illustration, cute render, soft clay material, vibrant colors."; break;
      default: styleKeywords = "Professional studio photography, 8k resolution, centered composition, sharp focus, cinematic commercial lighting."; break;
    }

    const promoContext = data.discountBadge ? `\nADVERTISING CONTEXT: This is a promotional offer for ${data.discountBadge}. The mood should be exciting and appetizing.` : "";

    let prompt = `
      Professional Food Photography for Instagram Story (Vertical 9:16).
      MAIN SUBJECT: A mouth-watering dish of ${data.mainDish}.
      VISUAL ELEMENTS: The dish contains ${data.proteins}. The food should look steaming hot, fresh, and gourmet.${promoContext}
      COMPOSITION: Dynamic and premium, leave space for text overlays at the bottom and top.
      STYLE: ${styleKeywords}
      Vertical composition. High resolution, 8k, commercial quality.
    `;

    if (refinement?.negativePrompt) {
      prompt += `\n\nNEGATIVE PROMPT: Avoid ${refinement.negativePrompt}.`;
    }

    const generationConfig: any = {
      imageConfig: {
        aspectRatio: "9:16"
      },
      temperature: 1,
      topP: 0.95,
    };

    if (refinement?.seed) {
      generationConfig.seed = refinement.seed;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: generationConfig
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    
    throw new Error("No image data found");
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};

const generateCaption = async (data: CreativeData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const pricesText = data.priceOptions?.map(p => `${p.label}: ${p.value}`).join(', ') || '';
    
    // Formatando os novos campos
    const extrasText = data.additionalSideDishes?.filter(i => i.label).map(i => `${i.label} (+${i.value})`).join(', ') || '';
    const drinksText = data.drinkOptions?.filter(i => i.label).map(i => `${i.label} (${i.value})`).join(', ') || '';
    const dessertsText = data.dessertOptions?.filter(i => i.label).map(i => `${i.label} (${i.value})`).join(', ') || '';

    const promoMention = data.discountBadge ? `\nPROMOÇÃO: ${data.discountBadge}!` : '';

    const finalPrompt = `
      Atue como um Social Media Copywriter especialista em Gastronomia. 
      Escreva uma legenda para o Instagram do restaurante "${data.brandName}".
      
      PRATO PRINCIPAL: ${data.mainDish}.
      ACOMPANHAMENTOS: ${data.proteins}.
      
      TABELA DE PREÇOS: ${pricesText}.
      ${extrasText ? `OPCIONAIS/EXTRAS: ${extrasText}.` : ''}
      ${drinksText ? `BEBIDAS: ${drinksText}.` : ''}
      ${dessertsText ? `SOBREMESAS: ${dessertsText}.` : ''}
      ${promoMention}
      
      CONTATO/WHATSAPP: ${data.whatsapp}.
      TAXA DE ENTREGA: ${data.deliveryPrice || 'Consultar'}.

      REQUISITOS:
      - Headline chamativa com emojis.
      - Descrição apetitosa dos itens principais.
      - Mencionar os extras e sobremesas de forma vendedora (upsell).
      - CTA focado em ${data.ctaText}.
      - Hashtags estratégicas no final.
      - Tom: Persuasivo, amigável e com gatilhos de urgência/fome.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: { maxOutputTokens: 800, temperature: 0.85 }
    });

    return response.text || "Confira nosso cardápio de hoje!";
  } catch (error) {
    return `Confira as novidades de ${data.brandName}!`;
  }
};
