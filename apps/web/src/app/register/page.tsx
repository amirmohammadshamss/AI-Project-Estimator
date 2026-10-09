'use client';
import { texts } from '../../content/register-page';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegister } from '../../hooks/use-auth';
import { ApiError } from '../../lib/api-client';

import { registerSchema } from '../../schemas/register';
import type { RegisterForm } from '../../types/register';

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data: RegisterForm) => {
    registerUser.mutate(data, {
      onSuccess: () => router.push('/dashboard'),
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">{texts.createAnAccount}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              {texts.name}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              {texts.email}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              {texts.password}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          {registerUser.isError && (
            <p className="text-sm text-red-600">
              {registerUser.error instanceof ApiError
                ? registerUser.error.message
                : texts.registrationFailed}
            </p>
          )}
          <button
            type="submit"
            disabled={registerUser.isPending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {registerUser.isPending ? texts.creatingAccount : texts.createAccount}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          {texts.alreadyHaveAnAccount}{' '}
          <Link href="/login" className="font-medium text-slate-900 underline">
            {texts.logIn}
          </Link>
        </p>
      </div>
    </main>
  );
}
