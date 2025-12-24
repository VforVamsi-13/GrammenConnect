
export interface User {
  name: string;
  email: string;
}

export type Language = 
  | 'en' // English
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'te' // Telugu
  | 'mr' // Marathi
  | 'ta' // Tamil
  | 'ur' // Urdu
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'or' // Odia
  | 'as'; // Assamese

export enum AppView {
  LANDING = 'LANDING',
  PORTAL = 'PORTAL',
  LEARNING_DETAIL = 'LEARNING_DETAIL'
}

export enum ModalType {
  NONE = 'NONE',
  LOGIN = 'LOGIN',
  RESUME = 'RESUME',
  SCHEMES = 'SCHEMES',
  GOVERNANCE = 'GOVERNANCE',
  MOBILITY = 'MOBILITY',
  MARKET = 'MARKET',
  MARKET_SELL = 'MARKET_SELL',
  HEALTH_CHAT = 'HEALTH_CHAT',
  GLOBAL_CHAT = 'GLOBAL_CHAT',
  VISION = 'VISION',
  OFFLINE_RESOURCES = 'OFFLINE_RESOURCES',
  COMMUNITY_HELP = 'COMMUNITY_HELP'
}

export interface LearningModule {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  content?: string;
}

export interface MarketItem {
  id: string;
  name: string;
  price: string;
  seller: string;
  location: string;
  image: string;
  contact: string; // Phone number
}
