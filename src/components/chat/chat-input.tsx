import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Paperclip, Search, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import { useLocation, useMatch, useNavigate } from '@tanstack/react-router';
import { useFileUpload } from '@/hooks/use-file-upload';
import { AttachmentPreview } from './attachment-preview';
import { ModelSelect } from './model-select';
import { useLazyChatContext } from './chat-context';
import { LocalStorage } from '@/utils/local-storage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useModelInfo } from './hooks/use-model-info';
import { useDebounce } from 'use-debounce';
import { openByokModal } from './event.utils';
import { useAppContext } from '@/context/app-context';

const focusInput = () => {
  const textArea = document.getElementById(
    'text-area'
  ) as HTMLTextAreaElement | null;

  if (!textArea) {
    return;
  }

  textArea.focus();
  textArea.selectionStart = textArea.value.length;
  textArea.selectionEnd = textArea.value.length;
};

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
  const location = useLocation();
  const [enableSearch, setEnableSearch] = useState(false);
  const { chat } = useLazyChatContext();
  const { model, fileUploads, webSearch, modelId, setModelId, available } =
    useModelInfo(initialModel, chat?.model);
  const [leftAlert, setLeftAlert] = useState({
    show: true,
    count: location.state?.remainingMessages,
  });

  const {
    attachments,
    isUploading,
    errors,
    handleFiles,
    removeAttachment,
    reset: resetFiles,
  } = useFileUpload();
  const match = useMatch({
    from: '/_app/share/$chatId',
    shouldThrow: false,
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: useConvexMutation(
      api.messages.mutations.sendMessage
    ).withOptimisticUpdate((store, args) => {
      // if chatId is provided, update the model in the chat
      if (!args.chatId) {
        return;
      }

      const messages = store.getQuery(api.messages.queries.getChatMessages, {
        chatId: args.chatId,
      });

      store.setQuery(
        api.messages.queries.getChatMessages,
        {
          chatId: args.chatId,
        },
        [
          ...(messages || []),
          {
            ...args,
            _creationTime: Date.now(),
            _id: Math.random().toString(36).substring(2, 15) as Id<'messages'>,
            chatId: args.chatId,
            content: args.content,
            role: 'user',
          },
        ]
      );
    }),
    onSuccess: ({ message, remainingMessages }) => {
      setInput('');
      resetFiles();

      if (!message?.chatId) return;

      const navigationState = {
        message,
        remainingMessages,
        fromSharedChat: Boolean(match),
      };

      if (message.chatId !== chatId) {
        navigate({
          to: '/chat/$chatId',
          params: { chatId: message.chatId },
          state: navigationState,
        });
      } else if (typeof remainingMessages === 'number') {
        setLeftAlert((current) => ({
          ...current,
          count: remainingMessages,
        }));
        navigate({
          to: '/chat/$chatId',
          params: { chatId: message.chatId },
          state: navigationState,
          replace: true,
        });
      }
    },
    onError: (error, variables) => {
      if (variables.chatId === chatId && !input.trim()) {
        setInput(variables.content);
      }
      if (error.message?.includes('exceeded')) {
        toast.error(
          'Daily message quota exceeded. Please login to increase your limit or use your own API keys.'
        );
      } else {
        toast.error(
          `Failed to send message.\n\n${error.message || 'Unknown error'}`
        );
      }
    },
  });

  const handleSubmit = () => {
    if (!input.trim() && !attachments?.length) {
      return;
    }

    if (!available) {
      toast.error(
        'Model is not available. Please select a different model or set your API keys in the sidebar.'
      );
      return;
    }

    LocalStorage.input.clear(chatId);
    LocalStorage.model.clear();
    LocalStorage.currentModel.clear();
    const userKeys = LocalStorage.byok.get();
    setLeftAlert((current) => ({
      ...current,
      count: current.count ? Math.max(0, current.count - 1) : 0,
    }));
    sendMessage({
      chatId: chatId as Id<'chats'> | undefined,
      content: input,
      model: modelId,
      attachments,
      userKeys: userKeys.openai || userKeys.openrouter ? userKeys : undefined,
      search: enableSearch && webSearch.supported,
    });
    setInput('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      handleFiles(newFiles);
      focusInput();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (event.clipboardData.files && event.clipboardData.files.length > 0) {
      event.preventDefault();
      const newFiles = Array.from(event.clipboardData.files);
      handleFiles(newFiles);
      focusInput();
    }
  };

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

  const { userKeys } = useAppContext();
  const showAlert = !userKeys.openai && !userKeys.openrouter && leftAlert.show;

  return (
    <>
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isPending || isUploading}
        onSubmit={handleSubmit}
        className="w-full backdrop-blur-3xl bg-transparent border-b-0 self-center-safe border-2 shadow-sm focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-1 transition-all"
      >
        {showAlert && (
          <div className="h-fit animate-in fade-in-70 zoom-in-95 absolute -translate-y-4 left-1/2 -translate-x-1/2 bottom-full flex-col w-fit px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-sm flex gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-amber-800 text-xs m-0 font-semibold tracking-wide">
                {!leftAlert.count
                  ? 'No messages remaining today'
                  : `${leftAlert.count} message${leftAlert.count === 1 ? '' : 's'} remaining today`}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-fit p-0 ms-auto w-fit -translate-y-0.5"
                onClick={() => {
                  setLeftAlert((current) => ({
                    ...current,
                    show: false,
                  }));
                }}
              >
                <X className="size-4 text-amber-500 ms-auto cursor-pointer" />
              </Button>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setLeftAlert((current) => ({
                  ...current,
                  show: false,
                }));
                openByokModal();
              }}
              className="text-amber-700 h-fit p-0 hover:text-amber-800 font-medium text-xs underline-offset-2 hover:underline transition-colors"
            >
              Add your own API keys to chat without limits
            </Button>
          </div>
        )}
        <AttachmentPreview
          attachments={attachments}
          errors={errors}
          isUploading={isUploading}
          removeAttachment={removeAttachment}
        />

        <PromptInputTextarea
          autoFocus
          placeholder="Type your message here..."
          className="text-muted-foreground placeholder:text-muted-foreground/50 font-medium"
          onPaste={handlePaste}
          // Passing the ref breaks is internal ref logic. We can either update that to use forwardRef
          // or just use id to focus the input (which is what we do here)
          id="text-area"
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
                    <Paperclip className="size-3.5" />
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
              isUploading
                ? 'Please wait for files to upload...'
                : !available
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
              disabled={isPending}
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
    </>
  );
}
