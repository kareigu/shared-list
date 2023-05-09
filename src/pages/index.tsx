import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { InfinitySpin } from "react-loader-spinner";

import MainLayout from "~/components/MainLayout";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { data: sessionData, status } = useSession();

  const SelectView = () => {
    switch (status) {
      case "loading":
        return <InfinitySpin color="white" />
      case "unauthenticated":
        return <NotSignedInView />
      case "authenticated":
        return <YourListsView />
    }
  }

  return (
    <>
      <Head>
        <title>Shared List</title>
        <meta name="description" content="Shared lists" />
        <link rel="icon" href="/icon.png" />
      </Head>
      <MainLayout>
        <div className="container flex flex-col items-center justify-center gap-4 px-2 py-6">
          <SelectView />
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
  const { data: sessionData } = useSession();


  const { data: lists, isLoading } = api.lists.getListsForUser.useQuery(undefined, {
    enabled: sessionData !== null,
  });
  console.log(lists);

  if (isLoading)
    return (
      <InfinitySpin color="white" />
    )

  if (!lists)
    return (
      <h1
        className="text-4xl animate-slide-right text-left 
                  pl-3 w-full font-extrabold select-none tracking-tight text-white sm:text-[5rem]"
      >
        Error Fetching Lists
      </h1>
    )

  if (lists.length === 0)
    return (
      <h1
        className="text-4xl text-left pl-3 w-full animate-slide-right 
                  font-extrabold select-none tracking-tight text-white sm:text-[5rem]"
      >
        No Lists Available
      </h1>
    )

  return (
    <>
      <h1
        className="text-5xl text-left pl-3 w-full animate-slide-right 
                  font-extrabold select-none tracking-tight text-white sm:text-[5rem]"
      >
        Your Lists
      </h1>
      <div className="grid grid-cols-1 gap-4 w-3/4 sm:grid-cols-2 md:gap-8 animate-slide-up">
        {lists.map((list) => (
          <Link
            key={list.id}
            className="flex max-w-xs flex-col gap-4 rounded-xl w-full 
              backdrop-blur bg-white/10 h-52 p-4 text-white transition hover:bg-white/20 active:bg-blue-400/20"
            href={`/l/${list.id}`}
          >
            <div className="flex flex-row items-center justify-start">
              <h3 className="text-2xl font-bold">{list.name} →</h3>
              <div className="mr-1 ml-auto flex flex-row gap-1">
                <Image
                  className="rounded-full"
                  width={20}
                  height={20}
                  src={list.owner.image ?? "/default-user.png"}
                  alt="Creator profile picture"
                  title={list.owner.name ?? "Creator"}
                />
                {list.collaborators.map((c) => (
                  <Image
                    className="rounded-full"
                    width={20}
                    height={20}
                    src={c.image ?? "/default-user.png"}
                    alt="Creator profile picture"
                    title={c.name ?? "Collaborator"}
                  />
                ))}

              </div>
            </div>
            <div className="w-full">
              {list.items.length === 0 &&
                <span>No items included</span>
              }
              {list.items.length > 0 &&
                list.items.map((item) => (
                  <div key={item.id} className="flex flex-row justify-start items-center gap-2">
                    <span className="text-blue-400">{item.completed ? "✓" : " "}</span>
                    <span className={item.completed ? "" : "ml-3"}>{item.text}</span>
                  </div>
                ))
              }
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export default Home;
