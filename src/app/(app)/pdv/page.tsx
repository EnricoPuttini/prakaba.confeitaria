import Link from "next/link";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PdvClient } from "./pdv-client";

export default async function PdvPage() {
  const supabase = await createClient();

  const { data: operation } = await supabase
    .from("sales_operations")
    .select("id")
    .eq("status", "ABERTA")
    .maybeSingle();

  if (!operation) {
    return (
      <>
        <PageHeader title="PDV — Venda Presencial" description="Registro rápido de vendas presenciais." />
        <Card>
          <EmptyState
            icon={Lock}
            title="Nenhuma operação aberta"
            description="Abra uma operação de caixa para começar a registrar vendas."
            action={
              <Button asChild>
                <Link href="/operacoes">Abrir operação</Link>
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sale_price")
    .eq("active", true)
    .order("name");

  return (
    <>
      <PageHeader title="PDV — Venda Presencial" description="Registro rápido de vendas presenciais." />
      <PdvClient operationId={operation.id} products={products ?? []} />
    </>
  );
}
