"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";

import { signIn, signUp } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Add a display name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["listener", "creator"]),
});

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function AuthForm({ mode }: AuthFormProps) {
  return mode === "sign-in" ? <SignInForm /> : <SignUpForm />;
}

function AuthCard({
  title,
  description,
  footer,
  children,
}: React.PropsWithChildren<{
  title: string;
  description: string;
  footer: React.ReactNode;
}>) {
  return (
    <Card className="w-full border-white/20 bg-white/80 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:bg-slate-950/70">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="soft">WaveStream Access</Badge>
          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Secure demo shell
          </span>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {children}
        <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
      </CardContent>
    </Card>
  );
}

function SignInForm() {
  const router = useRouter();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      toast.success("Welcome back to WaveStream.");
      router.push("/discover");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    },
  });

  return (
    <AuthCard
      title="Sign in to your studio"
      description="Continue with your creator or listener account. The frontend is wired safely even before the backend lands."
      footer={
        <>
          New here?{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/sign-up">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@studio.com" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="********" {...form.register("password")} />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Connecting..." : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}

function SignUpForm() {
  const router = useRouter();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", role: "listener" },
  });

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      toast.success("Account created.");
      router.push("/discover");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    },
  });

  return (
    <AuthCard
      title="Create your WaveStream profile"
      description="Join with a listener or creator profile. All validation runs locally and stays compile-safe."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/sign-in">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" placeholder="Jordan North" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@studio.com" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="********" {...form.register("password")} />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">I am joining as</Label>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as SignUpValues["role"])}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listener">Listener</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.role ? (
            <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
