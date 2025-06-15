import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { Id } from '@convex/_generated/dataModel';
import { api } from '@convex/_generated/api';
import { ShareIcon, CheckIcon, ClipboardIcon, Loader2 } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Input } from '../ui/input';
import { toast } from 'sonner';

export default function ChatShare({ chatId }: { chatId: Id<'chats'> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sharedChatId, setSharedChatId] = useState<string | null>(null);
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const shareChatMutation = useConvexMutation(api.chats.mutations.shareChat);

  const { mutate: shareChat, isPending: isCreatingLink } = useMutation({
    mutationFn: shareChatMutation,
    onSuccess: (newChatId: string) => {
      toast.success('You can now share the link with others.');
      setSharedChatId(newChatId);
    },
  });

  const handleShare = () => {
    if (chatId) {
      shareChat({ chatId });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      setTimeout(() => setSharedChatId(null), 500); // reset after dialog closes
    } else {
      setIsOpen(true);
    }
  };

  const shareUrl = `${window.location.origin}/share/${sharedChatId || String(chatId).slice(String(chatId).length / 2)}`;

  const Icon = isCopied ? CheckIcon : ClipboardIcon;

  return (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(true)}>
        <ShareIcon className="size-4" />
        <span>Share</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share public link to this chat</DialogTitle>
            <DialogDescription>
              Your name, custom instructions, and any conversation you have
              after sharing will remain private.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input key={shareUrl} defaultValue={shareUrl} readOnly />
            </div>
            <Button
              size="sm"
              className="px-3"
              onClick={() => {
                if (isCreatingLink) {
                  return;
                }

                if (sharedChatId) {
                  copyToClipboard(shareUrl);
                  return;
                }

                handleShare();
              }}
            >
              {isCreatingLink ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              <span>{sharedChatId ? 'Copy link' : 'Create link'}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
