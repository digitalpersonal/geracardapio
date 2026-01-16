
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

  // Prompt completo para Imagen
  const fullPrompt = buildImagePrompt(data, refinement, true);

  try {
    // 1. TENTATIVA PRINCIPAL: Imagen 3.0 (Melhor qualidade visual)
    console.log("Tentando gerar com Imagen 3.0...");
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: fullPrompt,
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
    console.warn("Imagen 3.0 falhou. Tentando fallback...", error.message);
    
    // 2. TENTATIVA SECUNDÁRIA: Gemini 2.5 Flash Image 
    const simplePrompt = buildImagePrompt(data, refinement, false);
    
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: simplePrompt }]
        },
      });

      if (fallbackResponse.candidates && fallbackResponse.candidates.length > 0) {
        for (const part of fallbackResponse.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
             const mime = part.inlineData.mimeType || 'image/png';
             return `data:${mime};base64,${part.inlineData.data}`;
          }
        }
      }
      
      const textResponse = fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        throw new Error(`O modelo recusou gerar a imagem: ${textResponse}`);
      }
      throw new Error("O modelo não retornou dados de imagem.");

    } catch (fallbackError: any) {
      console.error("Erro fatal em ambos os modelos:", fallbackError);
      throw new Error(`Falha na IA. Tente simplificar a descrição do prato.`);
    }
  }
};

const buildImagePrompt = (data: CreativeData, refinement?: ImageRefinement, isComplex: boolean = true): string => {
  
  // Prompt Simplificado para o Fallback (Gemini Flash)
  if (!isComplex) {
    return `Professional food photography, top-down view. A delicious plate of ${data.mainDish} featuring ${data.proteins}. High quality, photorealistic, restaurant menu style.`;
  }

  // Configuração de Estilo Avançada para Imagen 3.0
  let aestheticSettings = "";
  
  switch (data.artStyle) {
    case 'Minimalista': 
      aestheticSettings = `
        STYLE: Minimalist Scandi-style food photography. 
        LIGHTING: High-key, soft diffuse window light, very soft shadows.
        BACKGROUND: Clean white marble or light gray matte surface.
        COMPOSITION: Sophisticated plating, plenty of negative space, organized geometric arrangement.
        MOOD: Clean, airy, modern, fresh.
      `;
      break;
      
    case 'Luxo': 
      aestheticSettings = `
        STYLE: High-end Fine Dining / Michelin Star aesthetic.
        LIGHTING: Moody chiaroscuro lighting, dramatic shadows, spotlight on the food.
        BACKGROUND: Dark slate, black stone, or dark rustic wood texture.
        PROPS: Gold cutlery, crystal glass hints in background, elegant garnish.
        MOOD: Expensive, exclusive, savory, rich.
      `;
      break;
      
    case 'Vibrante': 
      aestheticSettings = `
        STYLE: Pop-Art / Commercial Advertising style.
        LIGHTING: Hard studio lighting, high contrast, distinct sharp shadows.
        BACKGROUND: Solid colorful background (orange, yellow or blue) or vibrant tablecloth.
        COLORS: High saturation, punchy colors, energetic.
        MOOD: Fun, fast, delicious, loud.
      `;
      break;
      
    default: // Realista / Padrão
      aestheticSettings = `
        STYLE: Professional Commercial Food Photography.
        LIGHTING: Natural 'Golden Hour' side lighting, warm tones.
        BACKGROUND: Blurred restaurant table or wooden texture.
        DETAILS: Steam rising (hot food), glisten on meat/sauce, water droplets on fresh salad.
        LENS: 85mm macro lens, shallow depth of field (bokeh background).
        MOOD: Appetizing, comforting, homemade, juicy.
      `;
      break;
  }

  // Construção do Prompt Final
  let prompt = `
    Create a stunning vertical (9:16 aspect ratio) food photograph.
    
    SUBJECT: A gourmet dish of **${data.mainDish}**.
    INGREDIENTS VISIBLE: **${data.proteins}**.
    
    ${aestheticSettings}
    
    QUALITY: Award-winning photography, 8k resolution, highly detailed textures, sharp focus on the main protein, hyper-realistic, no text overlay, no watermarks.
  `;
  
  if (refinement?.negativePrompt) {
    prompt += `\nAVOID: ${refinement.negativePrompt}, distorted food, plastic look, blurry, oversaturated, text, logo.`;
  }

  return prompt;
};

const generateCaption = async (data: CreativeData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const pricesText = data.priceOptions?.map(p => `${p.label}: ${p.value}`).join(', ') || '';
    
    const finalPrompt = `
      Atue como um Social Media de restaurante. Crie uma legenda de Instagram para vender este prato.
      Seja curto, use quebras de linha e emojis.
      
      Restaurante: "${data.brandName}".
      Prato: ${data.mainDish} (${data.proteins}).
      Preços: ${pricesText}.
      Contato/Delivery: ${data.whatsapp}.
      
      Call to Action: Incentive o pedido agora.
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
