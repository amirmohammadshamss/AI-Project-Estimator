'use client';
import { texts } from '../../content/dashboard-page';

import { useDashboard } from '../../hooks/use-dashboard';
import { DashboardOverview } from '../../components/dashboard-overview';
import { ApiError } from '../../lib/api-client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser, useLogout } from '../../hooks/use-auth';

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();
  const logout = useLogout();
  const stats = useDashboard(user?.id);

  useEffect(() => {
    if (isError && error instanceof ApiError && error.statusCode === 401) {
      router.replace('/login');
    }
  }, [isError, error, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">{texts.loading}</p>
      </main>
    );
  }

  if (!user) {
    return isError ? (
      <main className="p-8">
        <p role="alert">{texts.couldNotVerifyYourSession}</p>
        <button className="mt-3 underline" onClick={() => refetch()}>
          {texts.tryAgain}
        </button>
      </main>
    ) : null;
  }

  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{texts.dashboard}</h1>
        <button
          onClick={() => logout.mutate(undefined, { onSuccess: () => router.push('/login') })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          {texts.logOut}
        </button>
      </div>
      <p className="mt-4 text-slate-600">
        {texts.signedInAs}
        <span className="font-medium">{user.name ?? user.email}</span>
        {texts.symbol}
      </p>
      <Link
        href="/projects"
        className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {texts.viewProjects}
      </Link>
      {stats.isLoading && (
        <p className="mt-6" role="status">
          {texts.loadingDashboardStatistics}
        </p>
      )}
      {stats.isError && (
        <div className="mt-6" role="alert">
          <p>{texts.couldNotLoadDashboardStatistics}</p>
          <button className="mt-2 underline" onClick={() => stats.refetch()}>
            {texts.tryAgain}
          </button>
        </div>
      )}
      {stats.data && <DashboardOverview stats={stats.data} />}
    </main>
  );
}
