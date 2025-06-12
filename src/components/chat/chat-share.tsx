import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { Id } from '@convex/_generated/dataModel';
import { api } from '@convex/_generated/api';
import { ShareIcon, CheckIcon, ClipboardIcon } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Input } from '../ui/input';

export default function ChatShare({ chatId }: { chatId: Id<'chats'> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sharedChatId, setSharedChatId] = useState<string | null>(null);
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const shareChatMutation = useConvexMutation(api.chats.mutations.shareChat);

  const { mutate: shareChat, isPending: isSharing } = useMutation({
    mutationFn: shareChatMutation,
    onSuccess: (newChatId: string) => {
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

  const shareUrl = sharedChatId
    ? `${window.location.origin}/share/${sharedChatId}`
    : '';

  return (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(true)}>
        <ShareIcon className="size-4" />
        <span>Share</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share chat</DialogTitle>
            {!sharedChatId && (
              <DialogDescription>
                This will create a public link to a snapshot of this
                conversation.
              </DialogDescription>
            )}
          </DialogHeader>
          {sharedChatId ? (
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input id="link" defaultValue={shareUrl} readOnly />
              </div>
              <Button
                size="sm"
                className="px-3"
                onClick={() => copyToClipboard(shareUrl)}
              >
                <span className="sr-only">Copy</span>
                {isCopied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <ClipboardIcon className="size-4" />
                )}
              </Button>
            </div>
          ) : (
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="default"
                onClick={handleShare}
                disabled={isSharing}
              >
                Share
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
