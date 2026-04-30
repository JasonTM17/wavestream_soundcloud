'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { UserRole } from '@wavestream/shared';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildAuthHref, getFirstQueryValue, resolveAuthRedirect } from '@/lib/auth-routing';
import { forgotPassword, resetPassword, signIn, signUp, type AuthSession } from '@/lib/auth';
import { useT } from '@/lib/i18n';

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';
  nextPath?: string | string[] | null;
  resetToken?: string | string[] | null;
  onAuthenticatedSession?: (session: AuthSession) => void;
};

type SignInValues = { email: string; password: string };
type SignUpValues = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole.LISTENER | UserRole.CREATOR;
};
type ForgotPasswordValues = { email: string };
type ResetPasswordValues = { token: string; password: string; confirmPassword: string };

export function AuthForm({ mode, nextPath, resetToken, onAuthenticatedSession }: AuthFormProps) {
  if (mode === 'sign-in')
    return <SignInForm nextPath={nextPath} onAuthenticatedSession={onAuthenticatedSession} />;
  if (mode === 'sign-up')
    return <SignUpForm nextPath={nextPath} onAuthenticatedSession={onAuthenticatedSession} />;
  if (mode === 'forgot-password') return <ForgotPasswordForm nextPath={nextPath} />;
  return <ResetPasswordForm nextPath={nextPath} resetToken={resetToken} />;
}

export function AuthCard({
  title,
  description,
  footer,
  children,
}: React.PropsWithChildren<{ title: string; description: string; footer: React.ReactNode }>) {
  return (
    <Card className="w-full border-none bg-card shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {children}
        <p className="mt-6 text-sm leading-6 text-muted-foreground">{footer}</p>
      </CardContent>
    </Card>
  );
}

function SignInForm({
  nextPath,
  onAuthenticatedSession,
}: Pick<AuthFormProps, 'nextPath' | 'onAuthenticatedSession'>) {
  const router = useRouter();
  const t = useT('auth');
  const schema = z.object({
    email: z.string().email(t.validEmailRequired),
    password: z.string().min(8, t.passwordMin),
  });
  const form = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: (session) => {
      onAuthenticatedSession?.(session);
      toast.success(t.welcomeBack);
      router.replace(resolveAuthRedirect(nextPath));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t.validEmailRequired);
    },
  });

  return (
    <AuthCard
      title={t.signInTitle}
      description={t.signInDesc}
      footer={
        <>
          {t.noAccount}{' '}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={buildAuthHref('/sign-up', nextPath)}
          >
            {t.createAccount}
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <div className="space-y-2">
          <Label htmlFor="email">{t.emailLabel}</Label>
          <Input id="email" type="email" placeholder="you@email.com" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">{t.passwordLabel}</Label>
            <Link
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href={buildAuthHref('/forgot-password', nextPath)}
            >
              {t.recoveryLink}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? t.signingIn : t.signInButton}
        </Button>
      </form>
    </AuthCard>
  );
}

function SignUpForm({
  nextPath,
  onAuthenticatedSession,
}: Pick<AuthFormProps, 'nextPath' | 'onAuthenticatedSession'>) {
  const router = useRouter();
  const t = useT('auth');
  const schema = z.object({
    displayName: z.string().min(2, t.displayNameMin),
    username: z
      .string()
      .min(3, t.usernameMin)
      .max(24, t.usernameMax)
      .regex(/^[a-z0-9-_.]+$/i, t.usernamePattern),
    email: z.string().email(t.validEmailRequired),
    password: z.string().min(8, t.passwordMin),
    role: z.enum([UserRole.LISTENER, UserRole.CREATOR]),
  });
  const form = useForm<SignUpValues, unknown, SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      role: UserRole.LISTENER,
    },
  });

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: (session) => {
      onAuthenticatedSession?.(session);
      toast.success(t.accountCreated);
      router.replace(resolveAuthRedirect(nextPath));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t.validEmailRequired);
    },
  });

  return (
    <AuthCard
      title={t.signUpTitle}
      description={t.signUpDesc}
      footer={
        <>
          {t.alreadyHaveAccount}{' '}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={buildAuthHref('/sign-in', nextPath)}
          >
            {t.signInLink}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <div className="space-y-2">
          <Label htmlFor="displayName">{t.displayNameLabel}</Label>
          <Input id="displayName" placeholder="Tên của bạn" {...form.register('displayName')} />
          {form.formState.errors.displayName && (
            <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">{t.usernameLabel}</Label>
          <Input id="username" placeholder="ten-nguoi-dung" {...form.register('username')} />
          {form.formState.errors.username && (
            <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t.emailLabel}</Label>
          <Input id="email" type="email" placeholder="you@email.com" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">{t.roleLabel}</Label>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v as SignUpValues['role'])}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={t.rolePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.LISTENER}>{t.listenerOption}</SelectItem>
                  <SelectItem value={UserRole.CREATOR}>{t.creatorOption}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? t.signingUp : t.signUpButton}
        </Button>
      </form>
    </AuthCard>
  );
}

function ForgotPasswordForm({ nextPath }: Pick<AuthFormProps, 'nextPath'>) {
  const t = useT('auth');
  const schema = z.object({ email: z.string().email(t.validEmailRequired) });
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success(t.forgotSuccessMessage);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t.validEmailRequired);
    },
  });

  return (
    <AuthCard
      title={t.forgotTitle}
      description={t.forgotDesc}
      footer={
        <>
          {t.remembered}{' '}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={buildAuthHref('/sign-in', nextPath)}
          >
            {t.returnToSignIn}
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <div className="space-y-2">
          <Label htmlFor="forgot-email">{t.emailLabel}</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@email.com"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        {mutation.isSuccess && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {t.forgotSuccessMessage}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? t.sending : t.sendRecovery}
        </Button>
      </form>
    </AuthCard>
  );
}

function ResetPasswordForm({
  nextPath,
  resetToken,
}: Pick<AuthFormProps, 'nextPath' | 'resetToken'>) {
  const router = useRouter();
  const t = useT('auth');
  const resolvedToken = getFirstQueryValue(resetToken) ?? '';
  const hasPrefilledToken = resolvedToken.length > 0;
  const schema = z
    .object({
      token: z.string().min(1, t.tokenRequired),
      password: z.string().min(8, t.passwordMin),
      confirmPassword: z.string().min(8, t.confirmPasswordMin),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t.passwordsNoMatch,
      path: ['confirmPassword'],
    });
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: resolvedToken, password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success(t.passwordUpdated);
      router.replace(buildAuthHref('/sign-in', nextPath));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t.validEmailRequired);
    },
  });

  return (
    <AuthCard
      title={t.resetTitle}
      description={t.resetDesc}
      footer={
        <>
          {t.needFreshLink}{' '}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={buildAuthHref('/forgot-password', nextPath)}
          >
            {t.requestRecovery}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        {!hasPrefilledToken && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {t.noToken}
          </div>
        )}
        {!hasPrefilledToken ? (
          <div className="space-y-2">
            <Label htmlFor="token">{t.tokenLabel}</Label>
            <Input id="token" placeholder={t.tokenPlaceholder} {...form.register('token')} />
            {form.formState.errors.token && (
              <p className="text-sm text-destructive">{form.formState.errors.token.message}</p>
            )}
          </div>
        ) : (
          <input type="hidden" {...form.register('token')} />
        )}
        <div className="space-y-2">
          <Label htmlFor="new-password">{t.newPasswordLabel}</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t.confirmPasswordLabel}</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? t.updating : t.updatePassword}
        </Button>
      </form>
    </AuthCard>
  );
}
