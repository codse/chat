import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { Chat } from '@/types/chat';
import { api } from '@convex/_generated/api';
import { useNavigate } from '@tanstack/react-router';
import { kSetChat } from './utils';

export default function ChatListItemActions() {
  const navigate = useNavigate();

  const [state, setState] = useState<{
    chat: Pick<Chat, '_id' | 'title' | 'pinned'>;
    action: 'rename' | 'delete' | 'pin';
  }>();

  const { mutate: updateChatTitle } = useMutation({
    mutationFn: useConvexMutation(api.chats.mutations.updateChatTitle),
  });

  const { mutate: deleteChat, isPending: isDeleting } = useMutation({
    mutationFn: useConvexMutation(api.chats.mutations.deleteChat),
    onSuccess: () => {
      navigate({
        to: '/',
      });
    },
  });

  const { mutate: togglePin } = useMutation({
    mutationFn: useConvexMutation(api.chats.mutations.pinChat),
  });

  const handleDelete = () => {
    if (state?.chat?._id) {
      deleteChat({ chatId: state.chat._id });
    }
    setState(undefined);
  };

  useEffect(() => {
    const _setChat = (
      event: CustomEvent<{
        chat: Pick<Chat, '_id' | 'title' | 'pinned'>;
        action: 'rename' | 'delete' | 'pin';
      }>
    ) => {
      setState(undefined);
      const chatWithAction = event.detail;
      if (!chatWithAction?.chat?._id) {
        return;
      }

      if (chatWithAction.action === 'rename') {
        updateChatTitle({
          chatId: chatWithAction.chat._id,
          title: chatWithAction.chat.title,
        });
        return;
      }

      if (chatWithAction.action === 'pin') {
        togglePin({ chatId: chatWithAction.chat._id });
        return;
      }

      setState(chatWithAction);
    };

    window.addEventListener(kSetChat, _setChat as EventListener);

    return () => {
      window.removeEventListener(kSetChat, _setChat as EventListener);
    };
  }, []);

  const isDeleteDialogOpen = Boolean(
    state?.chat?._id && state.action === 'delete'
  );

  return (
    <>
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={() => setState(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
