import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { recommendedModelList } from '@/utils/models';
import { checkFileUploads, checkWebSearch } from '../chat.utils';
import { toast } from 'sonner';

export function useModelInfo(defaultModel?: string, chatModel?: string) {
  const [modelId, setModelId] = useState<string>(
    defaultModel || chatModel || recommendedModelList[0].id
  );

  const { userKeys } = useAppContext();
  const { model, fileUploads, webSearch } = useMemo(() => {
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
      model: selectedModel,
      fileUploads: checkFileUploads(selectedModel, userKeys),
      webSearch: checkWebSearch(selectedModel, userKeys),
    };
  }, [modelId, userKeys]);

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

  return { model, fileUploads, webSearch, modelId, setModelId };
}
