import { createServerSideHelpers } from "@trpc/react-query/server"
import { List, User } from "@prisma/client"
import { GetServerSideProps, NextPage } from "next"
import MainLayout from "~/components/MainLayout"
import { appRouter } from "~/server/api/root";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { TRPCError } from "@trpc/server";
import Image from "next/image";

type Props = {
  id: string,
  expired: boolean,
  used: boolean,
  invitedBy: {
    name: string | null,
    image: string | null,
  },
  list: {
    name: string,
  }
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== "string")
    return {
      notFound: true,
      props: {}
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

  if (inviteInfo instanceof TRPCError)
    if (inviteInfo.code === "UNAUTHORIZED")
      return {
        redirect: {
          destination: "/",
          statusCode: 307,
        },
      }
    else
      return {
        notFound: true,
      }

  const expired = Date.now()
    - inviteInfo.invite.createdAt.getTime()
    > (inviteInfo.invite.validMinutes * 60 * 1000);

  return {
    props: {
      id: inviteInfo.invite.id,
      expired,
      used: inviteInfo.invite.used,
      invitedBy: inviteInfo.invitedBy,
      list: inviteInfo.list,
    }
  }

}

const InvitePage: NextPage<Props> = (props) => {
  console.log(props);

  return (
    <MainLayout>
      <div className="flex flex-col justify-center items-center w-full h-full text-white">
        <div
          className="bg-gradient-to-br from-white/20 to-white/40 
            w-3/4 mt-12 py-4 px-4 flex flex-col items-center
            rounded backdrop-blur"
        >
          <h1 className="text-2xl bg-black/20 px-2 py-1 rounded text-center w-11/12">You've been invited to
            <br />
            <span className="text-blue-400 font-bold">{props.list?.name}</span>
          </h1>
          <div className="w-11/12 bg-black/20 p-2 rounded mt-2 h-full flex flex-col gap-4 gap-4 items-center">
            <span className="font-light text-gray-300 flex gap-2">by
              <span className="text-blue-400 font-semibold">
                {props.invitedBy?.name || "Unknown"}
              </span>
              <Image
                className="rounded-full width-auto"
                width={20}
                height={20}
                src={props.invitedBy?.image || "/default-user.png"}
                alt="Inviter profile picture"
              />
            </span>
            <button className="btn-rounded-red w-3/4 mt-auto ">Accept</button>
            <button className="btn-rounded-red w-3/4 mb-4">Decline</button>
          </div>
        </div>
      </div>
    </MainLayout >
  )
}

export default InvitePage;
