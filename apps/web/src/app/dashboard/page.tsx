'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser, useLogout } from '../../hooks/use-auth';

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  useEffect(() => {
    if (isError) {
      router.replace('/login');
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={() => logout.mutate(undefined, { onSuccess: () => router.push('/login') })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
      <p className="mt-4 text-slate-600">
        Signed in as <span className="font-medium">{user.name ?? user.email}</span>.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Project management and estimate analytics land here in later phases — see PLAN.md.
      </p>
    </main>
  );
}
