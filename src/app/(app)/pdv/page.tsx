import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-sm text-secondary-foreground">
              Nenhuma operação aberta no momento. Abra uma operação para começar a vender.
            </p>
            <Button asChild>
              <Link href="/operacoes">Abrir operação</Link>
            </Button>
          </CardContent>
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
