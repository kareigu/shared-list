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
          collaborators: {
            take: 2,
          },
          owner: true,
          items: {
            select: {
              id: true,
              text: true,
              completed: true,
            },
            orderBy: {
              updatedAt: "desc"
            },
            take: 5
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
  removeList: protectedProcedure
    .input(z.string().cuid())
    .mutation(({ input, ctx }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const list = await tx.list.findFirst({
          where: {
            id: input,
            ownerId: ctx.session.user.id,
          }
        });

        if (!list)
          throw new TRPCError({ code: "BAD_REQUEST", message: "No list found or not the owner" });

        const removed = await tx.list.delete({
          where: {
            id: list.id
          }
        }).catch((e: Error) => e);

        if (removed instanceof Error)
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: removed.message, cause: removed });

        return removed;
      });
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
      return ctx.prisma.$transaction(async (tx) => {
        const listItem = await tx.listItem.create({
          data: {
            listId: input.list,
            text: input.text,
            info: input.info,
            creatorId: ctx.session.user.id,
          }
        }).catch((e: Error) => e);

        if (listItem instanceof Error)
          throw new TRPCError({ code: "BAD_REQUEST", message: listItem.message })

        const update = await tx.list.update({
          where: {
            id: listItem.listId,
          },
          data: {
            updatedAt: new Date(),
          }
        }).catch((e: Error) => e);

        if (update instanceof Error)
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return listItem;
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
          completed: input.completed,
          list: {
            update: {
              updatedAt: new Date(),
            }
          }
        }
      })
    }),
  removeListItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.$transaction(
        async (tx) => {
          const toRemove = await tx.listItem.findFirst({
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
            },
          });

          if (!toRemove)
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid id or missing permissions" });

          const deleteResult = await tx.listItem.delete({
            where: {
              id: toRemove.id,
            }
          }).catch((e: Error) => e);


          if (deleteResult instanceof Error)
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });


          const updateAction = await ctx.prisma.list.update({
            where: {
              id: deleteResult.listId,
            },
            data: {
              updatedAt: new Date(),
            }
          }).catch((e: Error) => e);

          if (updateAction instanceof Error)
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't update list" });

          return deleteResult;
        });
    }),
});
