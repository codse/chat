import { Chat } from '@/types/chat';

export const kSetChat = 'set-chat-action';
export const kOpenNewChat = 'open-new-chat';
export const kOpenByokModal = 'open-byok-modal';

export const performAction = (
  action: 'rename' | 'delete' | 'pin',
  chat: Chat
) => {
  window.dispatchEvent(new CustomEvent(kSetChat, { detail: { chat, action } }));
};

export const openNewChat = () => {
  window.dispatchEvent(
    new CustomEvent(kOpenNewChat, { detail: { action: 'new' } })
  );
};

export const openByokModal = () => {
  window.dispatchEvent(new CustomEvent(kOpenByokModal));
};
