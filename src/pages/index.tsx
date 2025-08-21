import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) return { redirect: { destination: "/dashboard", permanent: false } };
  return { redirect: { destination: "/auth/login", permanent: false } };
};

export default function Index() { return null; } 