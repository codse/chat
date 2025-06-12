import { defineSchema } from 'convex/server';
import { attachmentsTable } from './attachments/table';
import { chatsTable } from './chats/table';
import { messagesTable } from './messages/table';
import { usersTable } from './users/table';

const convexSchema = defineSchema({
  users: usersTable,
  chats: chatsTable,
  messages: messagesTable,
  attachments: attachmentsTable,
});

export default convexSchema;
