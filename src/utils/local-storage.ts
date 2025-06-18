import { isClientSide } from './linking-session';

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
    if (!isClientSide()) return {};
    try {
      return JSON.parse(localStorage.getItem(BYOK_KEY) || '{}');
    } catch {
      return {};
    }
  },
  set(keys: BYOKKeys) {
    if (isClientSide()) {
      localStorage.setItem(BYOK_KEY, JSON.stringify(keys));
    }
  },
  clear() {
    if (isClientSide()) {
      localStorage.removeItem(BYOK_KEY);
    }
  },
} as const;

const createSimpleStorage = (key: string) => {
  return {
    key,
    get: (suffix?: string) => {
      const trackingKey = [key, suffix].filter(Boolean).join(':');
      return isClientSide() ? localStorage.getItem(trackingKey) : undefined;
    },
    set: (value: string, suffix?: string) => {
      const trackingKey = [key, suffix].filter(Boolean).join(':');
      if (isClientSide()) {
        localStorage.setItem(trackingKey, value);
      }
    },
    clear: (suffix?: string) => {
      const trackingKey = [key, suffix].filter(Boolean).join(':');
      if (isClientSide()) {
        localStorage.removeItem(trackingKey);
      }
    },
  };
};

const InputStorage = createSimpleStorage(INPUT_KEY);

const ModelStorage = createSimpleStorage(MODEL_KEY);
const CurrentModelStorage = createSimpleStorage(CURRENT_MODEL_KEY);

export const LocalStorage = {
  byok: BYOKStorage,
  // Remember user's choice, after they explicitly select a model in the model select.
  // However, search params' model will take precedence.
  model: ModelStorage,
  // Preset model on navigation - like form new chat or chat list item.
  currentModel: CurrentModelStorage,
  input: InputStorage,
} as const;
