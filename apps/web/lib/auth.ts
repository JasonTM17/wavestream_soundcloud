import { apiRequest } from "@/lib/api";

export type AuthSession = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "listener" | "creator" | "admin";
  };
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  role: "listener" | "creator";
};

export async function signIn(input: SignInInput) {
  return apiRequest<{ success: boolean; data: AuthSession }>(
    "/api/auth/login",
    {
      method: "POST",
      body: input,
    },
  );
}

export async function signUp(input: SignUpInput) {
  return apiRequest<{ success: boolean; data: AuthSession }>(
    "/api/auth/register",
    {
      method: "POST",
      body: input,
    },
  );
}
