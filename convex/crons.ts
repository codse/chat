import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'clear-delete-chats',
  {
    minutes: 5,
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

export default crons;
