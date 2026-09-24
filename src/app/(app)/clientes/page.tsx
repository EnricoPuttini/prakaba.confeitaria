import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone, active")
    .order("name");

  return (
    <>
      <PageHeader title="Clientes" description="Cadastro de clientes da PRAKABÁ." />

      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/clientes/novo">Novo cliente</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {customers?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-secondary-foreground">
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Telefone</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-6 py-3">
                        <Link
                          href={`/clientes/${customer.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">{customer.phone ?? "—"}</td>
                      <td className="px-6 py-3">
                        <Badge tone={customer.active ? "success" : "neutral"}>
                          {customer.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum cliente cadastrado ainda"
              description="Cadastre o primeiro cliente da PRAKABÁ."
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href="/clientes/novo">Novo cliente</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
