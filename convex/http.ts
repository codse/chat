import { httpRouter } from 'convex/server';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';

const http = httpRouter();

http.route({
  path: '/clerk-users-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // TODO: Implement Clerk webhook validation

    const event = await request.json();

    switch (event.type) {
      case 'user.created': // intentional fallthrough
      case 'user.updated':
        await ctx.runMutation(internal.users.mutations.syncClerkUser, {
          data: event.data,
        });
        break;
      case 'user.deleted': {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.mutations.syncClerkUser, {
          data: {
            clerkId: clerkUserId,
            deleted: true,
          },
        });
        break;
      }
      default:
        console.log('Ignored Clerk webhook event', event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
