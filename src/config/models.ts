export type ModelConfig = {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  supportsTools?: boolean;
};

export const GEMINI_MODELS: ModelConfig[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Best balance of intelligence and speed',
    maxTokens: 8192,
    contextWindow: 1000000,
    supportsTools: true,
  },
];

export const DEFAULT_MODEL_ID = 'gemini-2.0-flash';

export const getModelById = (id: string): ModelConfig | undefined =>
  GEMINI_MODELS.find((m) => m.id === id);
