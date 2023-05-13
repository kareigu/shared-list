import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

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
  acceptInvite: protectedProcedure
    .input(z.string().cuid())
    .mutation(({ input, ctx }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const invite = await tx.invite.findUnique({
          where: {
            id: input,
          }
        });

        if (!invite)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid invite id" });

        if (Date.now() - invite.createdAt.getTime() > (invite.validMinutes * 60 * 1000))
          throw new TRPCError({ code: "FORBIDDEN", message: "expired invite" });

        if (invite.used)
          throw new TRPCError({ code: "FORBIDDEN", message: "invite already used" });


        const list = await tx.list.update({
          where: {
            id: invite.to,
          },
          data: {
            collaborators: {
              connect: {
                id: ctx.session.user.id
              }
            }
          }
        }).catch((e: Error) => e);

        if (list instanceof Error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "failed adding as list collaborator",
            cause: list
          });

        const inviteUpdated = await tx.invite.update({
          where: {
            id: invite.id,
          },
          data: {
            used: true,
            usedByUserId: ctx.session.user.id,
          }
        }).catch((e: Error) => e);

        if (inviteUpdated instanceof Error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update invite",
            cause: inviteUpdated
          });

        return inviteUpdated.to;
      });
    }),
});
