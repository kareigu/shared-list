import { NextPage } from "next";
import MainLayout from "~/components/MainLayout";
import { SubmitHandler, useForm } from "react-hook-form";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

type FormInputs = {
  name: string,
};

const CreateList: NextPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormInputs>();
  const router = useRouter();
  const createList = api.lists.createList.useMutation();

  const onSubmit: SubmitHandler<FormInputs> = async (values) => {
    console.info(values);
    const list = await createList.mutateAsync(values);
    router.push(`/l/${list.id}`);
  };

  return (
    <MainLayout>
      <div className="text-white w-full px-8 py-4 animate-slide-down">
        <h1 className="text-3xl font-semibold">Create a List</h1>
        <form
          className="mt-4 py-4 flex flex-col bg-white/10 rounded justify-center items-center"
          onSubmit={handleSubmit(onSubmit)}
        >
          <input
            className="bg-slate-700 rounded-full px-4 py-2"
            placeholder="List name"
            defaultValue="My List"
            {...register("name", { required: true })}
          />
          {errors.name && <span className="font-light text-sm text-red-400 mt-1"> Name is required </span>}
          <input className="btn-rounded-red my-4 cursor-pointer" type="submit" value="Create" />
        </form>
      </div>
    </MainLayout>
  )
}

export default CreateList;
