import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import MainLayout from "~/components/MainLayout";
import { api } from "~/utils/api";
import { InfinitySpin } from "react-loader-spinner";
import Image from "next/image";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { TRPCError } from "@trpc/server";
import { ListItem } from "@prisma/client";

type Props = {
  id: string,
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== "string")
    return {
      notFound: true,
    }


  return {
    props: {
      id,
    }
  }
}

const ListPage: NextPage<Props> = ({ id }) => {
  const { data: sessionData } = useSession();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { data: list, isLoading: listLoading } = api.lists.getListById.useQuery(id, {
    enabled: sessionData?.user !== null
  });
  const {
    data: listItems,
    isLoading: listItemsLoading,
    refetch: reloadListItems,
    error: listItemsError } = api.lists.getListItemsForList.useQuery(list?.id ?? "", {
      enabled: sessionData?.user !== null && typeof list !== "undefined",
    });

  console.log(list);

  if (listLoading || listItemsLoading)
    return (
      <MainLayout>
        <InfinitySpin color="white" />
      </MainLayout>
    )

  if (!list)
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center text-white mt-8 w-full">
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
            onAddItem={() => reloadListItems()}
          />
        }
        <div className="flex flex-col justify-center items-center text-white mt-8 w-full">
          <div className="flex flex-col justify-center items-center w-5/6 bg-white/10 rounded">
            <div className="flex flex-row pl-2 w-full justify-start 
                items-center bg-gradient-to-r from-black/10 to-black/30">
              <h1 className="text-2xl font-semibold">{list.name}</h1>
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
              reload={() => reloadListItems()}
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
          className="btn-rounded-red"
          onClick={() => setAddModalOpen(true)}
        >
          Add Item
        </button>
      </div>
    )

  return (
    <div className="min-h-[15rem] w-full flex flex-col justify-center items-center py-3 px-8 gap-4 gap-4">
      {error && <span className="text-red-400 text-xl font-semibold text-center">{error}</span>}
      {listItems.map((item) => (
        <div key={item.id} className="w-full flex flex-row gap-2 justify-start items-center">
          <input
            className="w-5 h-5 bg-white rounded-full text-red-500 
                        hover:bg-white/50 flex justify-center items-center font-bold text-xl"
            type="button"
            value={item.completed ? "✓" : "⤫"}
            onClick={async () => {
              const updated = await updateListItem.mutateAsync({
                listItem: item.id,
                completed: !item.completed,
              }).catch((e: TRPCError) => console.error(e));

              if (updated)
                reload();
            }}
          />
          <span>{item.text}</span>
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
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormInputs>();
  const createItem = api.lists.createListItem.useMutation();

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
      <div className="absolute w-full h-full bg-black/30 text-white" />
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          flex flex-col justify-center items-center
          w-3/4 text-white"
      >
        <div className="bg-gradient-to-br from-slate-700/70 to-slate-800/80 backdrop-blur w-full flex flex-col py-2 px-4 items-center h-64 rounded">
          <h1 className="text-3xl font-semibold">Add Item</h1>
          <form className="h-full flex flex-col gap-4 py-4" onSubmit={handleSubmit(onSubmit)}>
            <input
              placeholder="Item"
              className="px-4 py-2 bg-slate-600 text-white rounded-full"
              {...register("text", { required: true })}
            />
            <input
              placeholder="Extra info (optional)"
              className="px-4 py-2 bg-slate-600 text-white rounded-full"
              {...register("info")}
            />
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