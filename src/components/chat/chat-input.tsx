import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Paperclip, Square, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { modelsList } from '@/utils/models';
import { useNavigate } from '@tanstack/react-router';

export function ChatInput({
  chatId,
  defaultPrompt,
}: {
  chatId?: string;
  defaultPrompt?: string;
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState(defaultPrompt || '');
  const [files, setFiles] = useState<File[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [modelId, setModelId] = useState<string>(modelsList[0].id);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: useConvexMutation(api.messages.mutations.sendMessage),
    onSuccess: ({ chatId: newChatId }: { chatId: Id<'chats'> | undefined }) => {
      setInput('');
      setFiles([]);
      if (newChatId && newChatId !== chatId) {
        navigate({
          to: '/chat/$chatId',
          params: { chatId: newChatId },
          state: {
            message: {
              content: input,
            },
          },
        });
      }
    },
  });

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      sendMessage({
        chatId: chatId as Id<'chats'> | undefined,
        content: input,
        model: modelId,
        // attachments: files,
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = '';
    }
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isPending}
      onSubmit={handleSubmit}
      className="w-full bg-transparent max-w-(--breakpoint-md) mx-auto border-b-0 self-center-safe"
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            >
              <Paperclip className="size-4" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="hover:bg-secondary/50 rounded-full p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PromptInputTextarea autoFocus placeholder="Type your message here..." />

      <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2 px-2">
          <PromptInputAction tooltip="Model">
            <Select
              value={modelId}
              onValueChange={(value) => {
                setModelId(value);
              }}
            >
              <SelectTrigger className="border-none text-xs text-muted-foreground font-semibold px-1 shadow-none">
                <SelectValue placeholder="Select a model" />
                <SelectContent>
                  {modelsList.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectTrigger>
            </Select>
          </PromptInputAction>
          <PromptInputAction tooltip="Attach files">
            <label
              htmlFor="file-upload"
              className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Paperclip className="text-primary size-5" />
            </label>
          </PromptInputAction>
        </div>

        <PromptInputAction
          tooltip={isPending ? 'Stop generation' : 'Send message'}
        >
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleSubmit}
          >
            {isPending ? (
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
