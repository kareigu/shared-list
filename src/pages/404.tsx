import { NextPage } from "next";
import MainLayout from "~/components/MainLayout"


const NotFound: NextPage = () => {
  return (
    <MainLayout>
      <h1 className="text-white text-3xl mt-8 font-semibold">Not Found</h1>
    </MainLayout>
  )
}

export default NotFound;
