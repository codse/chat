import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Paperclip, Search, Square, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';
import { modelsList } from '@/utils/models';
import { useNavigate } from '@tanstack/react-router';
import { useFileUpload } from '@/hooks/use-file-upload';
import { AttachmentPreview } from './attachment-preview';
import { ModelSelect } from './model-select';

export function ChatInput({
  chatId,
  defaultPrompt,
  defaultModel,
}: {
  chatId?: string;
  defaultPrompt?: string;
  defaultModel?: string;
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState(defaultPrompt || '');
  const [modelId, setModelId] = useState<string>(
    defaultModel || modelsList[0].id
  );
  const selectedModel = modelsList.find((model) => model.id === modelId);
  const supportsFileUploads = selectedModel?.supports.includes('file');
  const supportsWebSearch = selectedModel?.supports.includes('search');

  const {
    attachments,
    isUploading,
    errors,
    handleFiles,
    removeAttachment,
    reset: resetFiles,
  } = useFileUpload();

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: useConvexMutation(api.messages.mutations.sendMessage),
    onSuccess: (message: Doc<'messages'> | null) => {
      setInput('');
      resetFiles();
      if (message?.chatId && message.chatId !== chatId) {
        navigate({
          to: '/chat/$chatId',
          params: { chatId: message.chatId },
        });
      }
    },
  });

  const handleSubmit = () => {
    if (input.trim() || attachments.length > 0) {
      sendMessage({
        chatId: chatId as Id<'chats'> | undefined,
        content: input,
        model: modelId,
        attachments,
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      handleFiles(newFiles);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (event.clipboardData.files && event.clipboardData.files.length > 0) {
      event.preventDefault();
      const newFiles = Array.from(event.clipboardData.files);
      handleFiles(newFiles);
    }
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isPending || isUploading}
      onSubmit={handleSubmit}
      className="w-full bg-transparent border-b-0 self-center-safe"
    >
      <AttachmentPreview
        attachments={attachments}
        errors={errors}
        isUploading={isUploading}
        removeAttachment={removeAttachment}
      />

      <PromptInputTextarea
        autoFocus
        placeholder="Type your message here..."
        onPaste={handlePaste}
      />

      <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <ModelSelect
            label={selectedModel?.name || 'Select model...'}
            onValueChange={(value) => {
              setModelId(value);
            }}
          />
          <PromptInputAction tooltip="Attach files">
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                size="icon"
                asChild
                disabled={!supportsFileUploads}
                className="h-8 w-8 rounded-full"
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
                disabled={isUploading}
              />
            </label>
          </PromptInputAction>
          <PromptInputAction tooltip="Search the web">
            <Button
              variant="outline"
              size="icon"
              disabled={!supportsWebSearch}
              className="h-8 w-8 rounded-full"
            >
              <Search className="size-3.5" />
            </Button>
          </PromptInputAction>
        </div>

        <PromptInputAction
          tooltip={isPending || isUploading ? 'Processing...' : 'Send message'}
        >
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full me-1"
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
