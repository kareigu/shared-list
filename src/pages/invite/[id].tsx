import { createServerSideHelpers } from "@trpc/react-query/server"
import { List, User } from "@prisma/client"
import { GetServerSideProps, NextPage } from "next"
import MainLayout from "~/components/MainLayout"
import { appRouter } from "~/server/api/root";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { TRPCError } from "@trpc/server";

type Props = {
  id: string,
  expired: boolean,
  used: boolean,
  invitedBy: User,
  list: List
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== "string")
    return {
      notFound: true,
    }

  const session = await getServerAuthSession(ctx);

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { session, prisma },
    transformer: superjson,
  });

  const inviteInfo = await helpers
    .invites
    .getInvite
    .fetch(id)
    .catch((e: TRPCError) => e);

  return {
    notFound: true,
  }

}

const InvitePage: NextPage<Props> = (props) => {

  return (
    <MainLayout>
      <div className="flex flex-col justify-center items-center w-full h-full text-white">
        <h1>Invited to access LIST</h1>
      </div>
    </MainLayout >
  )
}

export default InvitePage;
