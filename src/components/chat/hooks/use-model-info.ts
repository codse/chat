import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { recommendedModelList } from '@/utils/models';
import { checkFileUploads, checkWebSearch } from '../chat.utils';
import { toast } from 'sonner';
import { LocalStorage } from '@/utils/local-storage';

export function useModelInfo(
  initialModel?: string | null,
  chatModel?: string | null
) {
  const [modelId, _setModelId] = useState<string>(
    initialModel ||
      LocalStorage.currentModel.get() ||
      LocalStorage.model.get() ||
      recommendedModelList[0].id
  );

  const { userKeys } = useAppContext();
  const { available, model, fileUploads, webSearch } = useMemo(() => {
    const selectedModel = recommendedModelList.find(
      (model) => model.id === modelId
    );

    if (!selectedModel) {
      return {
        model: undefined,
        fileUploads: {
          supported: false,
          disabledReason: 'Model not available',
        },
        webSearch: { supported: false, disabledReason: 'Model not available' },
      };
    }

    return {
      available:
        selectedModel.free ||
        userKeys.openrouter ||
        (userKeys.openai && selectedModel.provider === 'openai'),
      model: selectedModel,
      fileUploads: checkFileUploads(selectedModel, userKeys),
      webSearch: checkWebSearch(selectedModel, userKeys),
    };
  }, [modelId, userKeys]);

  const setModelId = useCallback((modelId: string) => {
    _setModelId(modelId);
    LocalStorage.model.set(modelId);
    LocalStorage.currentModel.clear();
  }, []);

  useEffect(() => {
    if (
      chatModel &&
      !LocalStorage.model.get() &&
      !LocalStorage.currentModel.get()
    ) {
      setModelId(chatModel);
    }
  }, [chatModel]);

  useEffect(() => {
    if (model?.id) {
      return;
    }

    let message = 'Model is no longer available.';
    const defaultModel = recommendedModelList.find((item) => item.recommended);
    if (defaultModel) {
      message += ` Switching to default model: ${defaultModel.name}`;
      setModelId(defaultModel.id);
    }
    toast.warning(message);
  }, [model?.id]);

  return { available, model, fileUploads, webSearch, modelId, setModelId };
}
