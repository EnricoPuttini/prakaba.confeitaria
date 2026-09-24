import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ReservationForm } from "../reservation-form";
import { saveReservation } from "../actions";

export default async function NovaReservaPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase.from("products").select("id, name, sale_price").eq("active", true).order("name"),
    supabase.from("customers").select("id, name").eq("active", true).order("name"),
  ]);

  return (
    <>
      <PageHeader title="Nova reserva" description="Cadastre um pedido reservado ou encomenda." />
      {customers?.length === 0 && (
        <p className="mb-4 text-sm text-secondary-foreground">
          Nenhum cliente cadastrado ainda.{" "}
          <Link href="/clientes/novo" className="font-medium text-primary hover:underline">
            Cadastrar cliente
          </Link>
        </p>
      )}
      <ReservationForm
        products={products ?? []}
        customers={customers ?? []}
        action={saveReservation.bind(null, null)}
      />
    </>
  );
}
