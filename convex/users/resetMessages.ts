import { internalMutation } from '../_generated/server';

export const resetMessagesLeft = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const users = await ctx.db.query('users').collect();
    // TODO: This is a temporary solution to reset the messagesLeft for all users.
    // This should be done in a more efficient way.
    await Promise.all(
      users.map((user) =>
        ctx.db.patch(user._id, { messagesLeft: user.messagesPerDay ?? 0 })
      )
    );
  },
});
