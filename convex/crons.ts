import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'clear-delete-chats',
  {
    minutes: 30,
  },
  internal.chats.delete.clearDeletedChats
);

crons.interval(
  'delete-linking-sessions',
  {
    minutes: 10,
  },
  internal.linking.mutations.clearStaleSessions
);

// Reset messagesLeft for all users at midnight
crons.interval(
  'reset-messages-left',
  { hours: 24 },
  internal.users.resetMessages.resetMessagesLeft
);

export default crons;
