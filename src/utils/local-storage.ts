export const BYOK_KEY = 'chat:byok-keys';
export const MODEL_KEY = 'chat:model';
export const INPUT_KEY = 'chat:draft-input';
const CURRENT_MODEL_KEY = 'chat:current-model';

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

const createSimpleStorage = (key: string) => {
  return {
    key,
    get: (suffix?: string) => {
      const trackingKey = [key, suffix].filter(Boolean).join(':');
      return localStorage.getItem(trackingKey) || undefined;
    },
    set: (value: string, suffix?: string) => {
      const trackingKey = [key, suffix].filter(Boolean).join(':');
      localStorage.setItem(trackingKey, value);
    },
    clear: (suffix?: string) => {
      const trackingKey = [key, suffix].filter(Boolean).join(':');
      localStorage.removeItem(trackingKey);
    },
  };
};

const InputStorage = createSimpleStorage(INPUT_KEY);

const ModelStorage = createSimpleStorage(MODEL_KEY);
const CurrentModelStorage = {
  set: (value: string) => {
    sessionStorage.setItem(CURRENT_MODEL_KEY, value);
  },
  get: () => {
    return sessionStorage.getItem(CURRENT_MODEL_KEY);
  },
  clear: () => {
    sessionStorage.removeItem(CURRENT_MODEL_KEY);
  },
  pull: () => {
    const value = CurrentModelStorage.get();
    CurrentModelStorage.clear();
    return value;
  },
};

export const LocalStorage = {
  byok: BYOKStorage,
  model: ModelStorage,
  currentModel: CurrentModelStorage,
  input: InputStorage,
} as const;
