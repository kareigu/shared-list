import { signIn, signOut, useSession } from "next-auth/react";
import { PropsWithChildren, SetStateAction, useEffect, useRef, useState } from "react";
import Image from "next/image";

const MainLayout = (props: PropsWithChildren) => {
  const { data: sessionData } = useSession();
  const [userPanelOpen, setUserPanelOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 bg-slate-800 text-white 
          flex flex-row gap-4 justify-center items-center h-12
          box-shadow"
      >
        <h1 className="text-2xl font-bold ml-4 mr-auto select-none">Shared List</h1>
        <button
          className="rounded-full bg-red-500/90 px-4 py-1 
            font-semibold text-white no-underline transition hover:bg-white/20 mr-3"
          onClick={() => setUserPanelOpen(v => !v)}
        >
          <span className="flex flex-row justify-center items-center gap-2">
            <span>Menu</span>
            {sessionData?.user &&
              <span>
                <Image className="rounded-full" width={24} height={24} src={sessionData.user.image ?? "asd"} alt="Profile picture" />
              </span>
            }
            {!sessionData?.user &&
              <span>📖</span>
            }
          </span>
        </button>
      </header>
      <main className="relative flex min-h-screen flex-col items-center 
        bg-gradient-to-b from-gray-900 via-red-500 to-gray-900"
      >
        <>
          {userPanelOpen &&
            <UserPanel setOpen={setUserPanelOpen} />
          }
          {props.children}
        </>
      </main>
    </>
  )
}

type UserPanelProps = {
  setOpen: (v: boolean) => void,
}

const UserPanel: React.FC<UserPanelProps> = ({ setOpen }) => {
  const { data: sessionData } = useSession();
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Node ? event.target : null;

      if (bgRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [bgRef]);

  const buttonClasses = "w-full text-2xl font-semibold py-4 px-8 transition rounded text-white bg-red-500 hover:bg-slate-700";
  return (
    <>
      <div ref={bgRef} className="absolute w-full h-full bg-black/40" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          flex flex-col justify-center items-center
          w-3/4"
      >
        <div className="bg-slate-800 rounded flex flex-col py-4 px-8 gap-8 w-full justify-center items-center">
          {sessionData &&
            <>
              <button
                className={buttonClasses}
              >
                Create List
              </button>
              <button
                className={buttonClasses}
                onClick={() => signOut()}
              >
                Sign Out
              </button>
            </>
          }
          {!sessionData &&
            <button
              className={buttonClasses}
              onClick={() => signIn()}
            >
              Sign In
            </button>
          }
        </div>
      </div>
    </>
  )
}

export default MainLayout;
