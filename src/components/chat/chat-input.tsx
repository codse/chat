import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Paperclip, Search, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useFileUpload } from '@/hooks/use-file-upload';
import { AttachmentPreview } from './attachment-preview';
import { ModelSelect } from './model-select';
import { useLazyChatContext } from './chat-context';
import { LocalStorage } from '@/utils/local-storage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useModelInfo } from './hooks/use-model-info';
import { useDebounce } from 'use-debounce';

export function ChatInput({
  chatId,
  defaultPrompt,
  initialModel,
}: {
  chatId?: string;
  defaultPrompt?: string;
  initialModel?: string | null;
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState(
    defaultPrompt || LocalStorage.input.get(chatId) || ''
  );
  const [enableSearch, setEnableSearch] = useState(false);
  const { chat } = useLazyChatContext();
  const { model, fileUploads, webSearch, modelId, setModelId, available } =
    useModelInfo(initialModel, chat?.model);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    attachments,
    isUploading,
    errors,
    handleFiles,
    removeAttachment,
    reset: resetFiles,
  } = useFileUpload();
  const match = useMatch({
    from: '/share/$chatId',
    shouldThrow: false,
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: useConvexMutation(api.messages.mutations.sendMessage),
    onSuccess: (message: Doc<'messages'> | null) => {
      setInput('');
      resetFiles();
      if (message?.chatId && message.chatId !== chatId) {
        navigate({
          to: '/chat/$chatId',
          params: { chatId: message.chatId },
          state: {
            message,
            fromSharedChat: Boolean(match),
          },
        });
      }
    },
    onError: (error) => {
      toast.error(
        `Failed to send message.\n\n${error.message || 'Unknown error'}`
      );
      console.error(error);
    },
  });

  const handleSubmit = () => {
    if (input.trim() || attachments.length > 0) {
      if (!available) {
        toast.error(
          'Model is not available. Please select a different model or set your API keys in the sidebar.'
        );
        return;
      }

      LocalStorage.input.clear(chatId);
      LocalStorage.currentModel.set(modelId);
      const userKeys = LocalStorage.byok.get();
      sendMessage({
        chatId: chatId as Id<'chats'> | undefined,
        content: input,
        model: modelId,
        attachments,
        userKeys: userKeys.openai || userKeys.openrouter ? userKeys : undefined,
        search: enableSearch && webSearch.supported,
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      handleFiles(newFiles);
      textInputRef.current?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (event.clipboardData.files && event.clipboardData.files.length > 0) {
      event.preventDefault();
      const newFiles = Array.from(event.clipboardData.files);
      handleFiles(newFiles);
      textInputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (defaultPrompt?.length && textInputRef.current) {
      textInputRef.current.selectionStart = textInputRef.current.value.length;
      textInputRef.current.selectionEnd = textInputRef.current.value.length;
    }
  }, [defaultPrompt?.length]);

  const [debouncedInput] = useDebounce(input, 250, {
    maxWait: 1000,
    trailing: true,
  });

  useEffect(() => {
    if (debouncedInput.length) {
      LocalStorage.input.set(debouncedInput, chatId);
    } else {
      LocalStorage.input.clear(chatId);
    }
  }, [debouncedInput, chatId]);

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isPending || isUploading}
      onSubmit={handleSubmit}
      className="w-full backdrop-blur-3xl bg-transparent border-b-0 self-center-safe border-2 shadow-sm focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-1 transition-all"
    >
      <AttachmentPreview
        attachments={attachments}
        errors={errors}
        isUploading={isUploading}
        removeAttachment={removeAttachment}
      />

      <PromptInputTextarea
        ref={textInputRef}
        autoFocus
        placeholder="Type your message here..."
        className="text-muted-foreground placeholder:text-muted-foreground/50 font-medium"
        onPaste={handlePaste}
      />

      <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <ModelSelect
            label={model?.name || 'Select model...'}
            onValueChange={(value) => {
              setModelId(value);
            }}
            showLoading={!!chatId && !chat && !initialModel}
          />
          <PromptInputAction
            tooltip={
              fileUploads.disabledReason
                ? fileUploads.disabledReason
                : 'Attach files'
            }
          >
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                size="icon"
                asChild
                disabled={!fileUploads.supported}
                className={cn('h-8 w-8 rounded-full', {
                  'cursor-not-allowed opacity-50': fileUploads.disabledReason,
                })}
                onClick={() => {
                  if (fileUploads.disabledReason) {
                    toast.error(fileUploads.disabledReason);
                  }
                }}
              >
                <span>
                  <Paperclip className="text-primary size-3.5" />
                </span>
              </Button>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept="image/*,text/plain,application/pdf,text/markdown,text/csv,application/json"
                disabled={isUploading || !fileUploads.supported}
              />
            </label>
          </PromptInputAction>
          <PromptInputAction
            tooltip={
              webSearch.disabledReason
                ? webSearch.disabledReason
                : enableSearch
                  ? 'Disable web search'
                  : 'Search the web'
            }
          >
            <Button
              variant={
                enableSearch && webSearch.supported ? 'default' : 'outline'
              }
              size="icon"
              className={cn('h-8 w-8 rounded-full', {
                'cursor-not-allowed opacity-50': webSearch.disabledReason,
              })}
              onClick={() => {
                if (webSearch.disabledReason) {
                  toast.error(webSearch.disabledReason);
                  return;
                }

                setEnableSearch(!enableSearch);
              }}
            >
              <Search className="size-3.5" />
            </Button>
          </PromptInputAction>
        </div>

        <PromptInputAction
          tooltip={
            !available
              ? 'Model is not available. Please select a different model or set your API keys in the sidebar.'
              : 'Send message'
          }
        >
          <Button
            variant="default"
            size="icon"
            className={cn('h-8 w-8 rounded-full me-1', {
              'cursor-not-allowed opacity-50': !available,
            })}
            onClick={handleSubmit}
            disabled={isPending || isUploading}
          >
            {isPending || isUploading ? (
              <Square className="size-5 fill-current" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
