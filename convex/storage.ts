import { v } from 'convex/values';
import { mutation } from './_generated/server';

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const removeFile = mutation({
  args: {
    fileId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }
    // TODO: Delete file after marking the attachment in database as deleted
    // we need to change this.
    return await ctx.storage.delete(args.fileId);
  },
});
