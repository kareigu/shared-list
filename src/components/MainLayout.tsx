import { signIn, signOut, useSession } from "next-auth/react";
import { PropsWithChildren } from "react";

const MainLayout = (props: PropsWithChildren) => {
  const { data: sessionData } = useSession();

  return (
    <>
      <header className="sticky top-0 bg-slate-800 text-white 
          flex flex-row gap-4 justify-center items-center h-12
          box-shadow"
      >
        <h1 className="text-2xl font-bold ml-4 mr-auto select-none">Shared List</h1>
        <UserPanel className="mr-4" />
      </header>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-gray-900 via-red-400 to-gray-900">
        {props.children}
      </main>
    </>
  )
}

type UserPanelProps = {
  className?: string,
};

const UserPanel: React.FC<UserPanelProps> = ({ className }) => {
  const { data: sessionData } = useSession();

  return (
    <button
      className="rounded-full bg-red-400/90 px-4 py-1 
            font-semibold text-white no-underline transition hover:bg-white/20"
      onClick={sessionData ? () => void signOut() : () => void signIn()}
    >
      {sessionData ? "Sign out" : "Sign in"}
    </button>
  )
}

export default MainLayout;
