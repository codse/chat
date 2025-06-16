import { Model, ModelCapability } from '@/utils/models';
import { BYOKKeys } from '@/utils/local-storage';

function isOpenAIModel(model: Model) {
  return model.id.startsWith('openai/');
}

function verifyCapabilityAccess(
  model: Model,
  userKeys: BYOKKeys | undefined,
  feature: ModelCapability
) {
  const featureName = feature === 'file' ? 'File upload' : 'Web search';
  let isSupported = model.supports.includes(feature);

  if (!isSupported) {
    return {
      supported: false,
      disabledReason: `${featureName} is not supported by this model.`,
    };
  }

  const isOpenAi = isOpenAIModel(model);
  let disabledReason = undefined;

  if (isOpenAi && !userKeys?.openai) {
    isSupported = false;
    disabledReason = `Set up your OpenAI API key to enable ${featureName.toLowerCase()}`;
  }

  if (!isOpenAi && !userKeys?.openrouter) {
    isSupported = false;
    disabledReason = `Set up your OpenRouter API key to enable ${featureName.toLowerCase()}`;
  }

  return {
    supported: isSupported,
    disabledReason,
  };
}

export function checkFileUploads(model: Model, userKeys?: BYOKKeys) {
  return verifyCapabilityAccess(model, userKeys, 'file');
}

export function checkWebSearch(model: Model, userKeys?: BYOKKeys) {
  return verifyCapabilityAccess(model, userKeys, 'search');
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
