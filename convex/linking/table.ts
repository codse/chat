import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const linkingTable = defineTable({
  userId: v.id('users'),
});
