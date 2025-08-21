import { GetServerSideProps } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import AppShell from "@/components/layout/AppShell";

type Props = { user: { name?: string | null; email?: string | null } };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    const cb = encodeURIComponent("/map");
    return { redirect: { destination: `/auth/login?callbackUrl=${cb}`, permanent: false } };
  }
  return { props: { user: { name: session.user?.name ?? null, email: session.user?.email ?? null } } };
};

export default function Map({ user }: Props) {
  return (
    <AppShell title="Map">
      <Head>
        <title>Map • SpecimenStats</title>
      </Head>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gym Map
          </h1>
          <p className="text-gray-600">
            Find gyms near you and connect with local athletes
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Map Coming Soon
          </h2>
          <p className="text-gray-600">
            This feature is under development. You'll be able to find gyms here soon!
          </p>
        </div>
      </div>
    </AppShell>
  );
}
