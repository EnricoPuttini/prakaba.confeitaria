import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Endpoint de destino dos links de e-mail do Supabase (confirmação de
// cadastro, convite, magic link, redefinição de senha). Requer que os
// templates de e-mail do projeto Supabase apontem para
// `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}`
// em vez do `{{ .ConfirmationURL }}` padrão (fluxo implícito), para que a
// sessão seja estabelecida no servidor antes de qualquer redirecionamento.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?confirmError=1", request.url));
}
