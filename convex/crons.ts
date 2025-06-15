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

export default crons;
