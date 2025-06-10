import { ConvexHttpClient } from 'convex/browser';

export const convexClient = new ConvexHttpClient(process.env.CONVEX_URL!);
