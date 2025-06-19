import { internalMutation } from '../_generated/server';

export const resetMessagesLeft = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const users = await ctx.db.query('users').collect();
    // TODO: This is a temporary solution to reset the messagesLeft for all users.
    // This should be done in a more efficient way.
    // Track the last fill date and reset the messagesLeft if it's the next day
    // This way we can avoid the need to reset the messagesLeft for all users every day
    await Promise.all(
      users.map((user) =>
        ctx.db.patch(user._id, { messagesLeft: user.messagesPerDay ?? 0 })
      )
    );
  },
});
