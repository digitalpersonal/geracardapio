
import { GoogleGenAI } from "@google/genai";
import { CreativeData, GeneratedContent, ImageRefinement } from "../types";

export const generateMarmitaContent = async (data: CreativeData): Promise<GeneratedContent> => {
  const [imageResult, textResult] = await Promise.all([
    generateImageWithFallback(data),
    generateCaption(data)
  ]);

  return {
    imageUrl: imageResult,
    caption: textResult
  };
};

export const regenerateCreativeImage = async (data: CreativeData, refinement: ImageRefinement): Promise<string> => {
  return generateImageWithFallback(data, refinement);
};

// Função principal que gerencia as tentativas
const generateImageWithFallback = async (data: CreativeData, refinement?: ImageRefinement): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (data.customImage) return data.customImage;

  // Constrói o prompt base
  const basePrompt = buildImagePrompt(data, refinement);

  try {
    // 1. TENTATIVA PRINCIPAL: Imagen 3.0 (Melhor qualidade visual)
    console.log("Tentando gerar com Imagen 3.0...");
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: basePrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '9:16',
      }
    });

    const base64Bytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Bytes) return `data:image/jpeg;base64,${base64Bytes}`;
    
    throw new Error("Imagen retornou vazio.");

  } catch (error: any) {
    console.warn("Imagen 3.0 falhou, ativando fallback para Gemini 2.5 Flash Image...", error.message);
    
    // 2. TENTATIVA SECUNDÁRIA: Gemini 2.5 Flash Image (Mais compatível)
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: basePrompt }]
        },
        config: {
          // Flash image não usa responseMimeType para imagens, ele retorna inlineData
        }
      });

      // Procurar por partes de imagem na resposta
      for (const candidate of fallbackResponse.candidates || []) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
      
      throw new Error("Gemini Flash também não retornou imagem.");

    } catch (fallbackError: any) {
      console.error("Erro fatal em ambos os modelos:", fallbackError);
      // Lança o erro original para o usuário saber que a chave pode estar inválida
      throw new Error(`Falha na Geração: ${error.message} || Fallback: ${fallbackError.message}`);
    }
  }
};

const buildImagePrompt = (data: CreativeData, refinement?: ImageRefinement): string => {
  let styleKeywords = "";
  switch (data.artStyle) {
    case 'Minimalista': styleKeywords = "Minimalist photography, clean white background, soft shadows, high key lighting, sophisticated."; break;
    case 'Luxo': styleKeywords = "Luxury food photography, dark moody background, golden lighting accents, elegant composition."; break;
    case 'Vibrante': styleKeywords = "Pop art colors, high contrast, vivid saturation, energetic food plating, bright commercial lighting."; break;
    case 'Rustico': styleKeywords = "Rustic wooden table, natural sunlight, organic textures, farm-to-table aesthetic."; break;
    case 'Neon': styleKeywords = "Cyberpunk food art, neon lighting, dark background, futuristic glow."; break;
    case 'Ilustracao': styleKeywords = "3D Pixar style food illustration, cute render, soft clay material, vibrant colors."; break;
    default: styleKeywords = "Professional studio photography, 8k resolution, centered composition, sharp focus, cinematic commercial lighting."; break;
  }

  let prompt = `
    Professional Vertical Food Photography (9:16 Aspect Ratio).
    SUBJECT: Delicious ${data.mainDish} with ${data.proteins}.
    STYLE: ${styleKeywords}
    COMPOSITION: Top-down or 45-degree angle, centered, leaving space at top and bottom for text overlays.
    QUALITY: Award-winning food photography, 8k, highly detailed textures, steam rising, appetizing.
  `;

  if (data.discountBadge) prompt += `\nMood: Promotional, exciting, celebration.`;
  
  if (refinement?.negativePrompt) {
    prompt += `\nAvoid: ${refinement.negativePrompt}`;
  }

  return prompt;
};

const generateCaption = async (data: CreativeData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const pricesText = data.priceOptions?.map(p => `${p.label}: ${p.value}`).join(', ') || '';
    const extrasText = data.additionalSideDishes?.filter(i => i.label).map(i => `${i.label} (+${i.value})`).join(', ') || '';
    
    const finalPrompt = `
      Crie uma legenda de Instagram para o almoço do dia.
      Restaurante: "${data.brandName}".
      Prato: ${data.mainDish} (${data.proteins}).
      Preços: ${pricesText}.
      Extras: ${extrasText}.
      Contato: ${data.whatsapp}.
      
      Use emojis, seja persuasivo e curto. Foco na fome e no pedido imediato.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: finalPrompt,
    });

    return response.text || "Confira nosso cardápio de hoje!";
  } catch (error) {
    return `Hoje no ${data.brandName}: ${data.mainDish}!\nPeça pelo Whats: ${data.whatsapp}`;
  }
};
