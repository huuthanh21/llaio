import { GenerateContentConfig } from '@google/genai';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  config: GenerateContentConfig;
}
