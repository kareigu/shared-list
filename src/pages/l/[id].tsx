import z from "zod";
import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import MainLayout from "~/components/MainLayout";
import { api } from "~/utils/api";
import { InfinitySpin } from "react-loader-spinner";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import type { TRPCError } from "@trpc/server";
import type { List, ListItem, User } from "@prisma/client";
import { ListItemRules } from "~/utils/rules";

type Props = {
  id: string,
  baseUrl: string,
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = await z.string().cuid()
    .parseAsync(ctx.params?.id)
    .catch((e: Error) => e);
  if (id instanceof Error)
    return {
      notFound: true,
    }



  return {
    props: {
      id,
      baseUrl: `https://${ctx.req.headers.host || "localhost:3000"}`
    }
  }
}

const ListPage: NextPage<Props> = ({ id, baseUrl }) => {
  const { data: sessionData } = useSession();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { data: list, isLoading: listLoading } = api.lists.getListById.useQuery(id, {
    enabled: sessionData?.user !== undefined
  });
  const {
    data: listItems,
    isLoading: listItemsLoading,
    refetch: reloadListItems,
    error: listItemsError } = api.lists.getListItemsForList.useQuery(list?.id ?? "", {
      enabled: sessionData?.user !== undefined && list !== undefined,
    });

  const [infoModalOpen, setInfoModalOpen] = useState(false);


  const isOwner = sessionData?.user.id === list?.ownerId;

  if (listLoading || listItemsLoading)
    return (
      <MainLayout>
        <InfinitySpin color="white" />
      </MainLayout>
    )

  if (!list)
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center text-white mt-8 w-full animate-slide-down">
          <h1 className="text-3xl font-semibold">List Not Found</h1>
        </div>
      </MainLayout>
    )

  return (
    <MainLayout>
      <>
        {addModalOpen &&
          <AddItemModal
            setOpen={setAddModalOpen}
            listId={id}
            onAddItem={() => void reloadListItems()}
          />
        }
        {infoModalOpen &&
          <ListInfoModal
            baseUrl={baseUrl}
            list={list}
            setOpen={setInfoModalOpen}
          />
        }
        <div className="flex flex-col justify-center items-center text-white mt-8 mb-6 w-full animate-slide-down">
          <div className="flex flex-col justify-center items-center w-5/6 bg-white/10 backdrop-blur rounded-xl">
            <div className="flex flex-row pl-2 w-full justify-start 
                items-center bg-gradient-to-r from-black/10 to-black/30 rounded-t-xl">
              <h1
                className={`text-2xl font-semibold 
                  ${isOwner ? "select-none hover:text-blue-400 cursor-pointer" : "select-all hover:text-blue-200"}`}
                onClick={() => {
                  if (isOwner)
                    setInfoModalOpen(true)
                }}
              >
                {list.name}
              </h1>
              <span className="mr-0 ml-auto py-2 px-2 text-sm h-full select-none">
                Created by <span className="text-red-400 select-all">{list.owner.name}</span>
                <Image
                  className="rounded-full ml-1 inline"
                  width={16}
                  height={16}
                  src={list.owner.image ?? ""}
                  alt="List owner profile picture"
                />
              </span>
            </div>
            <ListItems
              listItems={listItems}
              setAddModalOpen={setAddModalOpen}
              reload={() => void reloadListItems()}
              error={listItemsError?.message}
            />
          </div>
        </div>
      </>
    </MainLayout>
  )
}

type ListItemsProps = {
  listItems?: ListItem[],
  reload: () => void,
  error?: string,
  setAddModalOpen: (v: boolean) => void,
}

const ListItems: React.FC<ListItemsProps> = ({
  listItems, setAddModalOpen, reload, error
}) => {
  const updateListItem = api.lists.updateListItem.useMutation();
  const removeListItem = api.lists.removeListItem.useMutation();

  if (!listItems)
    return (
      <div className="h-64 flex flex-col justify-center items-center gap-4 gap-4">
        <span className="text-2xl font-semibold">Error Getting Items</span>
        <button
          className="btn-rounded-red"
          onClick={() => reload()}
        >
          Refresh
        </button>
      </div>
    )

  if (listItems.length === 0)
    return (
      <div className="h-64 flex flex-col justify-center items-center gap-4 gap-4">
        <span className="text-2xl font-semibold">No Items Added</span>
        <button
          className="btn-rounded-red animate-bounce"
          onClick={() => setAddModalOpen(true)}
        >
          Add Item
        </button>
      </div>
    )

  return (
    <div className="min-h-[15rem] w-full flex flex-col justify-center items-center py-3 px-6 gap-3">
      {error && <span className="text-red-400 text-xl font-semibold text-center">{error}</span>}
      {listItems.map((item) => (
        <div key={item.id} className="w-full flex flex-row gap-3 justify-start items-center animate-slide-right">
          <button
            className="w-8 h-8 bg-white rounded-full text-blue-400 
                      hover:bg-white/50 flex justify-center 
                      active:bg-red-400/40 transition items-center font-bold text-4xl"
            onClick={() => {
              updateListItem.mutateAsync({
                listItem: item.id,
                completed: !item.completed,
              })
                .then(() => reload())
                .catch((e: TRPCError) => console.error(e));
            }}
          >
            {item.completed ? "✓" : ""}
          </button>
          <span className="font-light text-xl select-all line-clamp-1 hover:text-red-200">{item.text}</span>
          <button
            className="bg-white hover:bg-white/50 active:bg-red-400/40 transition 
                      rounded-lg w-6 h-6 text-red-500 mr-0 ml-auto 
              flex justify-center items-center font-light text-2xl"
            onClick={() => {
              removeListItem.mutateAsync(item.id)
                .then(() => reload())
                .catch((e) => console.error(e));
            }}
          >
            ✘
          </button>
        </div>
      ))}
      <button
        className="btn-rounded-red mb-0 mt-auto"
        onClick={() => setAddModalOpen(true)}
      >
        Add Item
      </button>
    </div>
  )
}

type ListInfoModalProps = {
  baseUrl: string,
  list: List & { collaborators: User[] },
  setOpen: (v: boolean) => void,
}

const ListInfoModal: React.FC<ListInfoModalProps> = ({ setOpen, list, baseUrl }) => {
  const [inviteId, setInviteId] = useState<string>();
  const mainRef = useRef<HTMLDivElement>(null);

  const removeList = api.lists.removeList.useMutation();
  const createInvite = api.invites.createInvite.useMutation();

  const router = useRouter();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Node ? event.target : null;

      if (!mainRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [mainRef, setOpen]);

  return (
    <>
      <div className="absolute w-full h-full bg-black/30 text-white z-10 backdrop-blur-sm" />
      <div ref={mainRef} className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          flex flex-col justify-center items-center
          w-3/4 lg:w-1/4 text-white z-20 animate-blur-in"
      >
        <div className="bg-gradient-to-br from-slate-700/70 to-slate-800/80 
          rounded-xl backdrop-blur w-full flex flex-col px-4 py-4 gap-2"
        >
          <h1 className="font-light text-sm text-blue-400">Info</h1>
          <input
            className="bg-slate-600 rounded-full py-1 px-4 select-all"
            value={list.name}
            readOnly
          />
          <h1 className="mt-4 font-light text-sm text-blue-400">Invite link</h1>
          <div className="flex flex-row justify-start items-center">
            <input
              className="bg-slate-600 rounded-l-full h-8 px-4 w-full select-all"
              value={inviteId ? `${baseUrl}/invite/${inviteId}` : ""}
              placeholder="Click to generate link"
              readOnly
            />
            <button
              className="btn-rounded-red rounded-l-none
                flex justify-center items-center font-light h-8 w-4"
              onClick={() => {
                createInvite.mutateAsync(list.id)
                  .then((invite) => setInviteId(invite.id))
                  .catch((e) => console.error(e));
              }}
            >
              ＋
            </button>
          </div>
          <button
            className="btn-rounded-red w-3/4 mx-auto mt-4"
            onClick={() => {
              removeList
                .mutateAsync(list.id)
                .then(() => router.push("/"))
                .catch((e) => console.error(e));
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </>
  )
}

type AddItemModalProps = {
  listId: string,
  setOpen: (v: boolean) => void,
  onAddItem: () => void,
}

type FormInputs = {
  text: string,
  info?: string,
}

const AddItemModal: React.FC<AddItemModalProps> = ({ setOpen, listId, onAddItem }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>({
    mode: "onChange",
    delayError: 450,
  });
  const createItem = api.lists.createListItem.useMutation();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Node ? event.target : null;

      if (!mainRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [mainRef, setOpen]);


  const onSubmit: SubmitHandler<FormInputs> = async (values) => {
    const item = await createItem.mutateAsync({
      list: listId,
      text: values.text,
      info: values.info
    }).catch((e: TRPCError) => console.error(e));
    console.log(item);
    if (item) {
      onAddItem();
      setOpen(false);
    }
  }

  return (
    <>
      <div className="absolute w-full h-full bg-black/30 text-white z-10 backdrop-blur-sm" />
      <div ref={mainRef} className="absolute top-2/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          flex flex-col justify-center items-center
          w-3/4 lg:w-1/4 text-white z-20 animate-blur-in"
      >
        <div className="bg-gradient-to-br from-slate-700/70 to-slate-800/80 backdrop-blur w-full flex flex-col py-2 px-4 items-center h-72 rounded rounded-xl">
          <h1 className="text-3xl font-semibold">Add Item</h1>
          { /* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form className="h-full flex flex-col gap-2 py-4" onSubmit={handleSubmit(onSubmit)}>
            <input
              placeholder="Item"
              className="px-4 py-2 bg-slate-600 text-white rounded-full"
              {...register(
                "text",
                {
                  required: "Item needs text",
                  maxLength: {
                    value: ListItemRules.textLength,
                    message: `Item too long (max ${ListItemRules.textLength} characters)`
                  }
                })}
            />
            {errors.text &&
              <span className="text-red-400 ml-4 animate-slide-right">
                {errors.text.message ?? errors.text.type}
              </span>
            }
            {!errors.text &&
              <span className="h-4" />
            }
            <input
              placeholder="Extra info (optional)"
              className="px-4 py-2 bg-slate-600 text-white rounded-full"
              {...register(
                "info",
                {
                  maxLength: {
                    value: ListItemRules.infoLength,
                    message: `Info too long (max ${ListItemRules.infoLength} characters)`
                  }
                }
              )}
            />
            {errors.info &&
              <span className="text-red-400 ml-4 animate-slide-right">
                {errors.info.message ?? errors.info.type}
              </span>
            }
            {!errors.info &&
              <span className="h-4" />
            }
            <div className="flex flex-row mb-1 mt-auto gap-8 justify-center w-full">
              <input type="submit" className="btn-rounded-red w-24" value="Add" />
              <button className="btn-rounded-red w-24" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ListPage;
