import { Doc } from '@convex/_generated/dataModel';

export type Chat = Omit<Doc<'chats'>, 'deleteTime'>;
export type Message = Omit<Doc<'messages'>, 'deleteTime'>;
export type User = Omit<Doc<'users'>, 'deleteTime'>;
