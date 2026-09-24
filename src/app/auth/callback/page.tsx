"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";

// Destino do link de e-mail (confirmação de cadastro e convite) enquanto o
// projeto Supabase usa os templates padrão (exigem SMTP customizado para
// editar). O template padrão redireciona para cá com a sessão no fragmento
// da URL (#access_token=...), que só o navegador consegue ler — por isso
// este componente roda no cliente em vez de usar uma rota de servidor.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("error")) {
      router.replace("/login?confirmError=1");
      return;
    }

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/onboarding");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/onboarding");
      }
    });

    const timeout = setTimeout(() => setTimedOut(true), 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <Logo subtitle={false} className="h-14 w-auto" />
      {timedOut ? (
        <>
          <p className="text-sm text-error">Não foi possível confirmar o acesso.</p>
          <a href="/login" className="text-sm font-medium text-primary hover:underline">
            Voltar para o login
          </a>
        </>
      ) : (
        <p className="text-sm text-secondary-foreground">Confirmando seu acesso...</p>
      )}
    </div>
  );
}
