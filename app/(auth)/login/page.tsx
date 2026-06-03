import { loginSchema } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export type ActionState = { error?: string; success?: boolean } | null;

async function loginAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  "use server";

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Credenciales inválidas" };
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Credenciales inválidas" };
    }

    return { success: true };
  } catch {
    return { error: "Credenciales inválidas" };
  }
}

export default function LoginPage() {
  return <LoginForm loginAction={loginAction} />;
}
