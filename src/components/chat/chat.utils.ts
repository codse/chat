import { Model } from '@/utils/models';
import { BYOKKeys } from '@/utils/local-storage';

function isOpenAIModel(model: Model) {
  return model.id.startsWith('openai/');
}

export function checkFileUploads(model: Model, userKeys?: BYOKKeys) {
  let supportsFileUploads = model.supports.includes('file');
  if (!supportsFileUploads) {
    return {
      supported: false,
      disabledReason: 'File uploads are not supported by this model',
    };
  }

  const isOpenAi = isOpenAIModel(model);
  let disabledReason = undefined;

  if (isOpenAi && !userKeys?.openai) {
    supportsFileUploads = false;
    disabledReason = 'Set up your OpenAI API key to enable file uploads';
  }

  if (!isOpenAi && !userKeys?.openrouter) {
    supportsFileUploads = false;
    disabledReason = 'Set up your OpenRouter API key to enable file uploads';
  }

  return {
    supported: supportsFileUploads,
    disabledReason,
  };
}

export function checkWebSearch(model: Model, userKeys?: BYOKKeys) {
  let supportsWebSearch = model.supports.includes('search');
  if (!supportsWebSearch) {
    return {
      supported: false,
      disabledReason: 'Web search is not supported by this model',
    };
  }

  const isOpenAi = isOpenAIModel(model);
  let disabledReason = undefined;

  if (isOpenAi && !userKeys?.openai) {
    supportsWebSearch = false;
    disabledReason = 'Set up your OpenAI API key to enable web search';
  }

  if (!isOpenAi && !userKeys?.openrouter) {
    supportsWebSearch = false;
    disabledReason = 'Set up your OpenRouter API key to enable web search';
  }

  return {
    supported: supportsWebSearch,
    disabledReason,
  };
}

export function isModelEnabled(model: Model, userKeys?: BYOKKeys) {
  if (model.free) {
    return true;
  }

  if (isOpenAIModel(model)) {
    return !!userKeys?.openai || !!userKeys?.openrouter;
  }

  return !!userKeys?.openrouter;
}
