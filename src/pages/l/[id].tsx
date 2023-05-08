import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import MainLayout from "~/components/MainLayout";
import { api } from "~/utils/api";
import { InfinitySpin } from "react-loader-spinner";
import Image from "next/image";
import { useState } from "react";

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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { data: list, isLoading, error } = api.lists.getListById.useQuery(id);

  if (isLoading)
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
        {addModalOpen && <AddItemModal setOpen={setAddModalOpen} />}
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
            {list.items.length === 0 &&
              <div className="h-64 flex flex-col justify-center items-center gap-4 gap-4">
                <span className="text-2xl font-semibold">No Items Added</span>
                <button className="btn-rounded-red" onClick={() => setAddModalOpen(true)}>Add Item</button>
              </div>
            }
          </div>
        </div>
      </>
    </MainLayout>
  )
}

type AddItemModalProps = {
  setOpen: (v: boolean) => void,
}

const AddItemModal: React.FC<AddItemModalProps> = ({ setOpen }) => {
  return (
    <>
      <div className="absolute w-full h-full bg-black/30 text-white" />
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          flex flex-col justify-center items-center
          w-3/4 text-white"
      >
        <div className="bg-gradient-to-br from-slate-700/70 to-slate-800/80 backdrop-blur w-full flex flex-col py-2 px-4 items-center h-64 rounded">
          <h1 className="text-3xl font-semibold">Add Item</h1>
          <form className="h-full flex flex-col gap-4 py-4">
            <input placeholder="Item" className="px-4 py-2 bg-slate-600 text-white rounded-full" />
            <input placeholder="Extra info (optional)" className="px-4 py-2 bg-slate-600 text-white rounded-full" />
            <div className="flex flex-row mb-1 mt-auto gap-8 justify-center w-full">
              <button className="btn-rounded-red w-24">Add</button>
              <button className="btn-rounded-red w-24" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ListPage;
