export type ModelProvider = {
  info: {
    name: string;
    logoUrl: string;
  };
  models: Model[];
};

export type Model = {
  supports: ('vision' | 'file' | 'text' | 'search' | 'reasoning')[];
  id: string;
  name: string;
  recommended?: boolean;
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
        name: 'Gemini 2.5 Flash (Preview)',
        recommended: true,
      },
      {
        supports: ['vision', 'file', 'text', 'search'],
        id: 'google/gemini-2.5-pro-preview',
        name: 'Gemini 2.5 Pro (Preview)',
        recommended: true,
      },
      {
        supports: ['vision', 'file', 'text', 'search'],
        id: 'google/gemini-2.5-flash-preview-05-20:thinking',
        name: 'Gemini 2.5 Flash (Thinking)',
      },
      {
        supports: ['vision', 'file', 'text', 'search'],
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
      },
      {
        supports: ['vision', 'file', 'text'],
        id: 'google/gemini-2.0-flash-lite-001',
        name: 'Gemini 2.0 Flash Lite',
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
        id: 'openai/gpt-4.1',
        name: 'GPT-4.1',
      },
      {
        supports: ['vision', 'text'],
        id: 'openai/gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
      },
      {
        supports: ['vision', 'text'],
        id: 'openai/gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        recommended: true,
      },
      {
        supports: ['vision', 'text'],
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
      },
      {
        supports: ['vision', 'text'],
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o-mini',
      },
      {
        supports: ['vision', 'text'],
        id: 'openai/gpt-4.5',
        name: 'GPT-4.5',
      },
      {
        supports: ['vision', 'text'],
        id: 'openai/gpt-imagegen',
        name: 'GPT ImageGen',
      },
      {
        supports: ['vision', 'text', 'reasoning'],
        id: 'openai/o3',
        name: 'o3',
      },
      {
        supports: ['vision', 'text', 'reasoning'],
        id: 'openai/o3-mini',
        name: 'o3-mini',
      },
      {
        supports: ['vision', 'text', 'reasoning'],
        id: 'openai/o4-mini',
        name: 'o4-mini',
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
        id: 'anthropic/claude-4-sonnet',
        name: 'Claude 4 Sonnet',
      },
      {
        supports: ['vision', 'file', 'text', 'reasoning'],
        id: 'anthropic/claude-4-sonnet-reasoning',
        name: 'Claude 4 Sonnet (Reasoning)',
      },
      {
        supports: ['vision', 'file', 'text'],
        id: 'anthropic/claude-4-opus',
        name: 'Claude 4 Opus',
      },
      {
        supports: ['vision', 'file', 'text'],
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        recommended: true,
      },
      {
        supports: ['vision', 'file', 'text', 'reasoning'],
        id: 'anthropic/claude-3.7-sonnet-reasoning',
        name: 'Claude 3.7 Sonnet (Reasoning)',
      },
      {
        supports: ['vision', 'file', 'text'],
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
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
        id: 'meta/llama-3.3-70b',
        name: 'Llama 3.3 70B',
      },
      {
        supports: ['vision', 'text'],
        id: 'meta/llama-4-scout',
        name: 'Llama 4 Scout',
      },
      {
        supports: ['vision', 'text'],
        id: 'meta/llama-4-maverick',
        name: 'Llama 4 Maverick',
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
      {
        supports: ['text', 'reasoning'],
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
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
        supports: ['text'],
        id: 'x/grok-3',
        name: 'Grok 3',
      },
      {
        supports: ['text', 'reasoning'],
        id: 'x/grok-3-mini',
        name: 'Grok 3 Mini',
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
        supports: ['text', 'reasoning'],
        id: 'qwen/qwen3-32b',
        name: 'Qwen 3',
      },
      {
        supports: ['vision', 'text'],
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72b',
        recommended: true,
      },
    ],
  },
} as const;

export const modelsList = Object.values(supportedModels)
  .flatMap((provider) =>
    provider.models.map((model) => ({
      ...model,
      provider: provider.info.name,
    }))
  )
  .filter((model) => model.recommended);
