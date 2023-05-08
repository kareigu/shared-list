import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

import MainLayout from "~/components/MainLayout";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();

  const { data } = api.lists.getListsForUser.useQuery(undefined, {
    enabled: sessionData !== null,
  });

  console.log(data);

  return (
    <>
      <Head>
        <title>Shared List</title>
        <meta name="description" content="Shared lists" />
        <link rel="icon" href="/icon.png" />
      </Head>
      <MainLayout>
        <div className="container flex flex-col items-center justify-center gap-4 px-2 py-6">
          {
            sessionData
              ? <YourListsView />
              : <NotSignedInView />
          }
        </div>
      </MainLayout>
    </>
  );
};

const NotSignedInView = () => {
  return (
    <div className="text-white">
      <h1> Log in to access your lists</h1>
    </div>
  )
}

const YourListsView = () => {
  return (
    <>
      <h1 className="text-5xl text-left pl-3 w-full font-extrabold select-none tracking-tight text-white sm:text-[5rem]">
        Your Lists
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
        <Link
          className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
          href="https://create.t3.gg/en/usage/first-steps"
          target="_blank"
        >
          <h3 className="text-2xl font-bold">First Steps →</h3>
          <div className="text-lg">
            Just the basics - Everything you need to know to set up your
            database and authentication.
          </div>
        </Link>
        <Link
          className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
          href="https://create.t3.gg/en/introduction"
          target="_blank"
        >
          <h3 className="text-2xl font-bold">Documentation →</h3>
          <div className="text-lg">
            Learn more about Create T3 App, the libraries it uses, and how
            to deploy it.
          </div>
        </Link>
      </div>
    </>
  )
}

export default Home;
