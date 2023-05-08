import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const listsRouter = createTRPCRouter({
  getListsForUser: protectedProcedure
    .query(({ ctx }) => {
      return ctx.prisma.list.findMany({
        where: {
          ownerId: ctx.session.user.id,
          OR: {
            collaborators: {
              some: {
                id: ctx.session.user.id,
              }
            }
          }
        }
      })
    }),
  createList: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.list.create({
        data: {
          name: input.name,
          ownerId: ctx.session.user.id,
        }
      })
    }),
  getListById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const list = await ctx.prisma.list.findUnique({
        where: {
          id: input,
        },
        include: {
          owner: true,
          collaborators: true,
          items: true,
        }
      });

      if (!list)
        throw new TRPCError({ code: "NOT_FOUND" });

      if (list.ownerId !== ctx.session.user.id && list.collaborators.filter(u => u.id === ctx.session.user.id).length == 0)
        throw new TRPCError({ code: "UNAUTHORIZED" });

      return list;
    }),
});
