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

    const file = await ctx.db.system.get(args.fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // TODO: implement user ownership check

    await ctx.storage.delete(args.fileId);
  },
});
