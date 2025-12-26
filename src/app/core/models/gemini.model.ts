import { GenerateContentConfig } from '@google/genai';

export interface GeminiConfig {
  model: string;
  config: GenerateContentConfig;
}
