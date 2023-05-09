import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { ListItemRules } from "~/utils/rules";

export const listsRouter = createTRPCRouter({
  getListsForUser: protectedProcedure
    .query(({ ctx }) => {
      return ctx.prisma.list.findMany({
        where: {
          OR: [
            { ownerId: ctx.session.user.id },
            {
              collaborators: {
                some: {
                  id: ctx.session.user.id,
                }
              }
            }]
        },
        select: {
          id: true,
          name: true,
          items: {
            select: {
              text: true,
              completed: true,
            },
            orderBy: {
              updatedAt: "asc"
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
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
        }
      });

      if (!list)
        throw new TRPCError({ code: "NOT_FOUND" });

      if (list.ownerId !== ctx.session.user.id && list.collaborators.filter(u => u.id === ctx.session.user.id).length == 0)
        throw new TRPCError({ code: "UNAUTHORIZED" });

      return list;
    }),
  getListItemsForList: protectedProcedure
    .input(z.string())
    .query(({ input, ctx }) => {
      return ctx.prisma.listItem.findMany({
        where: {
          AND: [
            { listId: input },
            {
              OR: [
                { list: { ownerId: ctx.session.user.id } },
                { list: { collaborators: { some: { id: ctx.session.user.id } } } }
              ]
            },
          ]
        },
        orderBy: {
          addedAt: "asc"
        }
      })
    }),
  createListItem: protectedProcedure
    .input(z.object(
      {
        list: z.string(),
        text: z.string()
          .max(ListItemRules.textLength, `Maximum ${ListItemRules.textLength} characters`),
        info: z.string()
          .max(ListItemRules.infoLength, `Maximum ${ListItemRules.infoLength} characters`)
          .optional()
      }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.listItem.create({
        data: {
          listId: input.list,
          text: input.text,
          info: input.info,
          creatorId: ctx.session.user.id,
        }
      })
    }),
  updateListItem: protectedProcedure
    .input(z.object({ listItem: z.string(), completed: z.boolean() }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.listItem.update({
        where: {
          id: input.listItem,
        },
        data: {
          completed: input.completed
        }
      })
    }),
  removeListItem: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      return ctx.prisma.listItem.deleteMany({
        where: {
          AND: [
            { id: input },
            {
              list: {
                OR: [
                  { ownerId: ctx.session.user.id },
                  { collaborators: { some: { id: ctx.session.user.id } } }
                ]
              }
            }
          ]
        }
      })
    }),
});
