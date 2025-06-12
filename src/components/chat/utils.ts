import { Chat } from '@/types/chat';

export const kSetChat = 'set-chat-action';

export const performAction = (
  action: 'rename' | 'delete' | 'pin',
  chat: Chat
) => {
  window.dispatchEvent(new CustomEvent(kSetChat, { detail: { chat, action } }));
};
