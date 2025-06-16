export const BYOK_KEY = 'chat:byok-keys';
const MODEL_KEY = 'chat:model';

export type BYOKKeys = {
  openai?: string;
  openrouter?: string;
};

const BYOKStorage = {
  key: BYOK_KEY,
  get(): BYOKKeys {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(BYOK_KEY) || '{}');
    } catch {
      return {};
    }
  },
  set(keys: BYOKKeys) {
    localStorage.setItem(BYOK_KEY, JSON.stringify(keys));
  },
  clear() {
    localStorage.removeItem(BYOK_KEY);
  },
} as const;

const ModelStorage = {
  key: MODEL_KEY,
  get(): string {
    return localStorage.getItem(MODEL_KEY) || '';
  },
  set(modelId: string) {
    localStorage.setItem(MODEL_KEY, modelId);
  },
  clear() {
    localStorage.removeItem(MODEL_KEY);
  },
} as const;

export const LocalStorage = {
  byok: BYOKStorage,
  model: ModelStorage,
} as const;
