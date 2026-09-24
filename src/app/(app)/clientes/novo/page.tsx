import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "../customer-form";
import { createCustomer } from "../actions";

export default function NovoClientePage() {
  return (
    <>
      <PageHeader title="Novo cliente" description="Cadastre um cliente da PRAKABÁ." />
      <CustomerForm action={createCustomer} submitLabel="Criar cliente" />
    </>
  );
}
