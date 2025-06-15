import { Doc } from '@convex/_generated/dataModel';

export type Chat = Omit<Doc<'chats'>, 'deleteTime'>;
export type Message = Omit<Doc<'messages'>, 'deleteTime'>;
export type User = Omit<Doc<'users'>, 'deleteTime'>;
export type PublicUser = Pick<
  User,
  'name' | 'email' | 'image' | '_id' | 'isAnonymous' | 'phone'
> & {
  chat?: {
    count: number;
  };
};

export type UnauthenticatedUser = {
  _id: null;
  isAnonymous: true;
};
