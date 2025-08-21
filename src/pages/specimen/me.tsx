import { GetServerSideProps } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import Humanoid2D from "@/components/specimen/Humanoid2D";
import BestMetrics from "@/components/specimen/BestMetrics";
import PercentileChart from "@/components/specimen/PercentileChart";
import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";

type Props = { user: { name?: string | null; email?: string | null } };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    const cb = encodeURIComponent("/specimen/me");
    return { redirect: { destination: `/auth/login?callbackUrl=${cb}`, permanent: false } };
  }
  return { props: { user: { name: session.user?.name ?? null, email: session.user?.email ?? null } } };
};

export default function MySpecimen({ user }: Props) {
  return (
    <AppShell title="My Specimen">
      <Head>
        <title>My Specimen • SpecimenStats</title>
      </Head>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Specimen Profile
          </h1>
          <p className="text-gray-600">
            Visualize your progress and see how you rank across different metrics
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 2D Humanoid Model */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Muscle Development</h2>
            <Suspense fallback={<SkeletonCard className="h-96" />}>
              <Humanoid2D />
            </Suspense>
          </div>

          {/* Best 5 Metrics */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Best 5 Metrics</h2>
            <Suspense fallback={<SkeletonCard className="h-96" />}>
              <BestMetrics />
            </Suspense>
          </div>
        </div>

        {/* Percentile Chart */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Percentile Performance</h2>
          <Suspense fallback={<SkeletonChart className="h-80" />}>
            <PercentileChart />
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
} 