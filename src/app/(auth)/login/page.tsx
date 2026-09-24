import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmEmail?: string; setupIncomplete?: string }>;
}) {
  const params = await searchParams;

  let notice: string | undefined;
  if (params.confirmEmail) {
    notice = "Enviamos um e-mail de confirmação. Confirme seu cadastro e faça login.";
  } else if (params.setupIncomplete) {
    notice = "Não encontramos os dados da sua confeitaria. Entre em contato com o suporte.";
  }

  return <LoginForm notice={notice} />;
}
