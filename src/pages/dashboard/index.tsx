import { GetServerSideProps } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import DashboardHero from "@/components/dashboard/DashboardHero";
import KPICards from "@/components/dashboard/KPICards";
import ELOChart from "@/components/dashboard/ELOChart";
import GymCard from "@/components/dashboard/GymCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";

type Props = { user: { name?: string | null; email?: string | null } };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    const cb = encodeURIComponent("/dashboard");
    return { redirect: { destination: `/auth/login?callbackUrl=${cb}`, permanent: false } };
  }
  return { props: { user: { name: session.user?.name ?? null, email: session.user?.email ?? null } } };
};

export default function Dashboard({ user }: Props) {
  return (
    <AppShell title="Dashboard">
      <Head>
        <title>Dashboard • SpecimenStats</title>
      </Head>

      <div className="space-y-8">
        {/* Hero Section */}
        <Suspense fallback={<SkeletonCard className="h-32" />}>
          <DashboardHero user={user} />
        </Suspense>

        {/* KPI Cards */}
        <Suspense fallback={<KPICards.Skeleton />}>
          <KPICards />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ELO Chart */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">ELO Progress</h2>
            <Suspense fallback={<SkeletonChart className="h-80" />}>
              <ELOChart />
            </Suspense>
          </div>

          {/* Gym Card */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Gym</h2>
            <Suspense fallback={<SkeletonCard className="h-80" />}>
              <GymCard />
            </Suspense>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <Suspense fallback={<RecentActivity.Skeleton />}>
            <RecentActivity />
          </Suspense>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <Suspense fallback={<QuickActions.Skeleton />}>
            <QuickActions />
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
}
