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
import { Chat } from '@/types/chat';
import { api } from '@convex/_generated/api';
import { useNavigate } from '@tanstack/react-router';
import { kSetChat } from './event.utils';
import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';

export default function ChatListItemActions() {
  const navigate = useNavigate();

  const [state, setState] = useState<{
    chat: Pick<Chat, '_id' | 'title' | 'type'>;
    action: 'rename' | 'delete' | 'pin';
  }>();

  const { mutate: updateChatTitle } = useMutation({
    mutationFn: useConvexMutation(
      api.chats.mutations.updateChatTitle
    ).withOptimisticUpdate((store, args) => {
      const chat = store.getQuery(api.chats.queries.getChat, {
        chatId: args.chatId,
      });
      if (chat !== undefined) {
        store.setQuery(
          api.chats.queries.getChat,
          { chatId: args.chatId },
          {
            ...chat,
            title: args.title,
          }
        );
      }
    }),
  });

  const { mutate: deleteChat } = useMutation({
    mutationFn: useConvexMutation(
      api.chats.mutations.deleteChat
    ).withOptimisticUpdate((store, args) => {
      const chat = store.getQuery(api.chats.queries.getChat, {
        chatId: args.chatId,
      });
      if (chat !== undefined) {
        store.setQuery(
          api.chats.queries.getChat,
          { chatId: args.chatId },
          {
            ...chat,
            type: 'deleted',
          }
        );
      }
    }),
  });

  const { mutate: togglePin } = useMutation({
    mutationFn: useConvexMutation(
      api.chats.mutations.pinChat
    ).withOptimisticUpdate((store, args) => {
      const chat = store.getQuery(api.chats.queries.getChat, {
        chatId: args.chatId,
      });
      if (chat !== undefined) {
        store.setQuery(
          api.chats.queries.getChat,
          { chatId: args.chatId },
          {
            ...chat,
            type: chat.type === 'pinned' ? undefined : 'pinned',
          }
        );
      }

      const setToList = (
        mode: 'pinned' | 'recent',
        chat: Chat | undefined,
        chatId: string
      ) => {
        const list = store.getQuery(api.chats.queries.listChats, {
          mode,
        });

        if (list !== undefined) {
          const updatedChats = [
            ...(list.chats || []),
            { ...chat, type: mode === 'pinned' ? 'pinned' : undefined },
          ] as Chat[];

          store.setQuery(
            api.chats.queries.listChats,
            { mode },
            {
              chats: updatedChats
                .filter(
                  (chat) =>
                    chat._id !== undefined && chat._creationTime !== undefined
                )
                .sort((a, b) => b._creationTime! - a._creationTime!),
            }
          );
        }
      };

      const removeFromList = (mode: 'pinned' | 'recent', chatId: string) => {
        const list = store.getQuery(api.chats.queries.listChats, {
          mode,
        });

        if (list !== undefined) {
          const updatedChats = (list.chats || [])?.filter(
            (c) => c._id !== chatId
          ) as Chat[];

          store.setQuery(
            api.chats.queries.listChats,
            { mode },
            {
              chats: updatedChats
                .filter(
                  (chat) =>
                    chat._id !== undefined && chat._creationTime !== undefined
                )
                .sort((a, b) => b._creationTime! - a._creationTime!),
            }
          );
        }
      };

      // If chat was pinned, remove from pinned and add to recent
      // If chat was not pinned, remove from recent and add to pinned
      if (chat?.type === 'pinned') {
        removeFromList('pinned', args.chatId);
        setToList('recent', chat, args.chatId);
      } else {
        removeFromList('recent', args.chatId);
        setToList('pinned', chat, args.chatId);
      }
    }),
  });

  const handleDelete = async () => {
    if (state?.chat?._id) {
      deleteChat({ chatId: state.chat._id });
      navigate({
        to: '/',
        replace: true,
      });
    }
    setState(undefined);
  };

  useEffect(() => {
    const _setChat = (
      event: CustomEvent<{
        chat: Pick<Chat, '_id' | 'title' | 'type'>;
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
            <DialogTitle>Delete {state?.chat?.title}?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
