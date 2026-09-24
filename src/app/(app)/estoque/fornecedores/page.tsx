import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SupplierForm } from "./supplier-form";

export default async function FornecedoresPage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, phone, email, active")
    .order("name");

  return (
    <>
      <PageHeader title="Fornecedores" description="Fornecedores de ingredientes e insumos." />

      <div className="mb-6">
        <SupplierForm />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-secondary-foreground">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Telefone</th>
                <th className="px-6 py-3 font-medium">E-mail</th>
              </tr>
            </thead>
            <tbody>
              {suppliers?.map((supplier) => (
                <tr key={supplier.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-foreground">{supplier.name}</td>
                  <td className="px-6 py-3 text-secondary-foreground">{supplier.phone ?? "—"}</td>
                  <td className="px-6 py-3 text-secondary-foreground">{supplier.email ?? "—"}</td>
                </tr>
              ))}
              {!suppliers?.length && (
                <tr>
                  <td className="px-6 py-6 text-secondary-foreground" colSpan={3}>
                    Nenhum fornecedor cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
