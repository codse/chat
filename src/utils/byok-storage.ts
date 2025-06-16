const BYOK_KEY = 'chat:byok-keys';

export type BYOKKeys = {
  openai?: string;
  openrouter?: string;
};

export const BYOKStorage = {
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
