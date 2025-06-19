import { defineSchema } from 'convex/server';
import { chatsTable } from './chats/table';
import { messagesTable } from './messages/table';
import { linkingTable } from './linking/table';
import { usersTable } from './users/table';
import { authTables } from '@convex-dev/auth/server';

const convexSchema = defineSchema({
  chats: chatsTable,
  messages: messagesTable,
  linking: linkingTable,
  ...authTables,
  users: usersTable,
});

export default convexSchema;
