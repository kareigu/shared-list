import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { ListItemRules } from "~/utils/rules";

export const invitesRouter = createTRPCRouter({
  getInvite: protectedProcedure
    .input(z.string())
    .query(({ input, ctx }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const invite = await tx.invite.findUnique({
          where: {
            id: input,
          }
        });

        if (!invite)
          throw new TRPCError({ code: "BAD_REQUEST" });

        const invitedBy = await tx.user.findUnique({
          where: {
            id: invite.creatorId,
          },
          select: {
            name: true,
            image: true,
          }
        });

        if (!invitedBy)
          throw new TRPCError({ code: "CONFLICT", message: "Malformed invite" });

        const list = await tx.list.findUnique({
          where: {
            id: invite.to,
          },
          select: {
            name: true,
          }
        });

        if (!list)
          throw new TRPCError({ code: "CONFLICT", message: "Malformed invite" });

        return {
          invite,
          invitedBy,
          list,
        }
      });
    }),
  createInvite: protectedProcedure
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
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid ID or not owner" });

        return tx.invite.create({
          data: {
            to: list.id,
            creatorId: ctx.session.user.id,
          }
        });
      });
    }),
});
