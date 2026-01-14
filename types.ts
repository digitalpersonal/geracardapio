
export type CreationType = 'restaurant';

export interface PriceOption {
  label: string;
  value: string;
}

export interface CreativeData {
  type: CreationType;
  brandName: string; 
  logo?: string; 
  
  // Visual Assets
  customImage?: string; 
  artStyle?: string;    
  logoX?: number; 
  logoY?: number; 
  logoDisplayMode?: string; 

  // Marketing Features
  discountBadge?: string; // Ex: "10% OFF", "PROMO"
  ctaText?: string;      // Ex: "PEÇA JÁ", "VER CARDÁPIO"

  // Specific for Restaurant
  mainDish: string; 
  proteins: string; 
  priceOptions: PriceOption[]; 
  additionalSideDishes?: PriceOption[]; // New: Opcionais/Guarnições extras
  deliveryPrice: string; 
  whatsapp: string;      
  dessertOptions: PriceOption[]; 
  drinkOptions: PriceOption[];   
  
  // Visual Toggles
  removeLogoBg?: boolean;
  removeCustomImageBg?: boolean;
}

export interface ImageRefinement {
  negativePrompt: string;
  seed: number;
}

export interface GeneratedContent {
  imageUrl: string;
  caption: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
