import { createTRPCRouter } from "~/server/api/trpc";
import { listsRouter } from "./routers/lists";
import { invitesRouter } from "./routers/invites";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  lists: listsRouter,
  invites: invitesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
