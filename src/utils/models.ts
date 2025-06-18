export type ModelProvider = {
  info: {
    name: string;
    logoUrl: string;
  };
  models: Model[];
};

export type ModelCapability =
  | 'vision'
  | 'file'
  | 'text'
  | 'search'
  | 'reasoning'
  | 'image';

export type InternalCapability = 'tool-call' | 'cite-source';

export type Model = {
  supports: ModelCapability[];
  capabilities?: InternalCapability[];
  id: string;
  name: string;
  recommended?: boolean;
  free?: boolean;
};

export const supportedModels: Record<string, ModelProvider> = {
  google: {
    info: {
      name: 'Google',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ai.google.dev/&size=256',
    },
    models: [
      {
        supports: ['vision', 'file', 'text', 'search'],
        id: 'google/gemini-2.5-flash-preview-05-20',
        capabilities: ['tool-call'],
        name: 'Gemini 2.5 Flash',
        recommended: true,
        free: true,
      },
      {
        supports: ['vision', 'file', 'text', 'reasoning'],
        id: 'google/gemini-2.5-pro-preview',
        capabilities: ['tool-call'],
        name: 'Gemini 2.5 Pro',
        recommended: true,
      },
    ],
  },
  perplexity: {
    info: {
      name: 'Perplexity',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.perplexity.ai/&size=256',
    },
    models: [
      {
        supports: ['text', 'vision', 'search'],
        capabilities: ['cite-source'],
        id: 'perplexity/sonar',
        name: 'Perplexity Sonar',
        recommended: true,
      },
    ],
  },
  openai: {
    info: {
      name: 'OpenAI',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://openai.com/&size=256',
    },
    models: [
      {
        supports: ['vision', 'text'],
        capabilities: ['tool-call'],
        id: 'openai/gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        recommended: true,
        free: true,
      },
      {
        supports: ['vision', 'file', 'text'],
        capabilities: ['tool-call'],
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        recommended: true,
      },
      {
        supports: ['vision', 'file', 'text'],
        capabilities: ['tool-call'],
        id: 'openai/gpt-4.1',
        name: 'GPT-4.1',
        recommended: true,
      },
      {
        supports: ['text', 'search'],
        capabilities: ['cite-source'],
        id: 'openai/gpt-4o-mini-search-preview',
        name: 'GPT-4o Mini Search',
        recommended: true,
      },
    ],
  },
  anthropic: {
    info: {
      name: 'Anthropic',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.anthropic.com/&size=256',
    },
    models: [
      {
        supports: ['vision', 'file', 'text'],
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        recommended: true,
      },
      {
        supports: ['vision', 'text', 'reasoning'],
        id: 'anthropic/claude-sonnet-4',
        name: 'Claude Sonnet 4',
        recommended: true,
      },
    ],
  },
  meta: {
    info: {
      name: 'Meta',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ai.meta.com/&size=256',
    },
    models: [
      {
        supports: ['text'],
        id: 'meta-llama/llama-4-scout',
        name: 'Llama 4 Scout',
        recommended: true,
      },
    ],
  },
  deepseek: {
    info: {
      name: 'DeepSeek',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://deepseek.com/&size=256',
    },
    models: [
      {
        supports: ['text'],
        id: 'deepseek/deepseek-chat-v3-0324',
        name: 'DeepSeek v3 (0324)',
        recommended: true,
      },
    ],
  },
  x: {
    info: {
      name: 'xAI',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://x.ai/&size=256',
    },
    models: [
      {
        supports: ['text', 'reasoning'],
        id: 'x-ai/grok-3-mini-beta',
        name: 'Grok 3 Mini (beta)',
        recommended: true,
      },
    ],
  },
  qwen: {
    info: {
      name: 'Qwen',
      logoUrl:
        'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://qwen.ai/&size=256',
    },
    models: [
      {
        supports: ['vision', 'text'],
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72b',
        recommended: true,
      },
    ],
  },
} as const;

const modelName = new Map<string, string>();

export const getModelName = (modelId?: string) => {
  return (modelId ? modelName.get(modelId) : '') || modelId;
};

export const recommendedModelList = Object.values(supportedModels)
  .flatMap((provider) => {
    return provider.models.map((model) => {
      modelName.set(model.id, model.name);
      return {
        ...model,
        provider: provider.info.name,
      };
    });
  })
  .filter((model) => model.recommended)
  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

export const defaultModelId = 'openai/gpt-4.1-nano';
