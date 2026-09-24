import Link from "next/link";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "./category-form";
import { PayableForm } from "./payable-form";
import { ReceivableForm } from "./receivable-form";
import { MarkPaidButton } from "./mark-paid-button";
import { markAccountPayablePaid, markAccountReceivablePaid } from "./actions";

const FINANCE_ROLES = ["OWNER", "MANAGER", "FINANCE"] as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}

function isOverdue(dueDate: string | null, status: string) {
  return !!dueDate && status === "PENDENTE" && new Date(dueDate) < new Date(new Date().toDateString());
}

export default async function FinanceiroPage() {
  const profile = await requireCurrentProfile();

  if (!FINANCE_ROLES.includes(profile.role as (typeof FINANCE_ROLES)[number])) {
    return (
      <>
        <PageHeader title="Financeiro" description="Contas a pagar e a receber." />
        <Card>
          <CardContent className="p-6 text-sm text-secondary-foreground">
            Você não tem permissão para acessar o financeiro.
          </CardContent>
        </Card>
      </>
    );
  }

  const supabase = await createClient();

  const [
    { data: payables },
    { data: receivables },
    { data: categories },
    { data: suppliers },
    { data: customers },
    { data: reservations },
  ] = await Promise.all([
    supabase
      .from("accounts_payable")
      .select("id, description, amount, due_date, paid_at, status, supplier_id, category_id")
      .order("due_date"),
    supabase
      .from("accounts_receivable")
      .select("id, description, amount, due_date, paid_at, status, customer_id")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("financial_categories").select("id, name").eq("active", true).order("name"),
    supabase.from("suppliers").select("id, name").eq("active", true).order("name"),
    supabase.from("customers").select("id, name").eq("active", true).order("name"),
    supabase
      .from("orders")
      .select("id, order_number, customer_id, total, scheduled_at")
      .eq("order_type", "RESERVATION")
      .neq("status", "CANCELADA")
      .neq("status", "ENTREGUE"),
  ]);

  const reservationIds = (reservations ?? []).map((r) => r.id);
  const { data: reservationPayments } = reservationIds.length
    ? await supabase.from("payments").select("order_id, amount").in("order_id", reservationIds)
    : { data: [] as { order_id: string; amount: number }[] };

  const paidByOrder = new Map<string, number>();
  for (const payment of reservationPayments ?? []) {
    paidByOrder.set(payment.order_id, (paidByOrder.get(payment.order_id) ?? 0) + payment.amount);
  }

  const customerNameById = new Map((customers ?? []).map((c) => [c.id, c.name]));
  const supplierNameById = new Map((suppliers ?? []).map((s) => [s.id, s.name]));
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const pendingReservations = (reservations ?? [])
    .map((order) => ({
      ...order,
      balance: order.total - (paidByOrder.get(order.id) ?? 0),
    }))
    .filter((order) => order.balance > 0.005);

  const totalPayablePending = (payables ?? [])
    .filter((a) => a.status === "PENDENTE")
    .reduce((sum, a) => sum + a.amount, 0);
  const totalReceivablePending =
    (receivables ?? []).filter((a) => a.status === "PENDENTE").reduce((sum, a) => sum + a.amount, 0) +
    pendingReservations.reduce((sum, r) => sum + r.balance, 0);
  const overduePayableCount = (payables ?? []).filter((a) => isOverdue(a.due_date, a.status)).length;

  return (
    <>
      <PageHeader title="Financeiro" description="Contas a pagar e a receber." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              A pagar (pendente)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalPayablePending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              A receber (pendente)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(totalReceivablePending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Contas vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${overduePayableCount > 0 ? "text-error" : "text-foreground"}`}>
              {overduePayableCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <PageHeader title="Contas a pagar" />
        <div className="mb-4">
          <CategoryForm />
        </div>
        <div className="mb-4">
          <PayableForm suppliers={suppliers ?? []} categories={categories ?? []} />
        </div>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-secondary-foreground">
                  <th className="px-6 py-3 font-medium">Descrição</th>
                  <th className="px-6 py-3 font-medium">Categoria</th>
                  <th className="px-6 py-3 font-medium">Fornecedor</th>
                  <th className="px-6 py-3 font-medium">Vencimento</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {payables?.map((account) => {
                  const overdue = isOverdue(account.due_date, account.status);
                  return (
                    <tr key={account.id} className="border-b border-border last:border-0">
                      <td className="px-6 py-3 text-foreground">{account.description}</td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {(account.category_id && categoryNameById.get(account.category_id)) ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {(account.supplier_id && supplierNameById.get(account.supplier_id)) ?? "—"}
                      </td>
                      <td className={`px-6 py-3 ${overdue ? "font-medium text-error" : "text-secondary-foreground"}`}>
                        {formatDate(account.due_date)}
                      </td>
                      <td className="px-6 py-3 text-foreground">{formatCurrency(account.amount)}</td>
                      <td className="px-6 py-3">
                        {account.status === "PAGO" ? (
                          <span className="text-success">Pago</span>
                        ) : overdue ? (
                          <span className="text-error">Vencida</span>
                        ) : (
                          <span className="text-secondary-foreground">Pendente</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {account.status === "PENDENTE" && (
                          <MarkPaidButton accountId={account.id} label="Marcar paga" action={markAccountPayablePaid} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!payables?.length && (
                  <tr>
                    <td className="px-6 py-6 text-secondary-foreground" colSpan={7}>
                      Nenhuma conta a pagar cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <PageHeader title="Contas a receber" />
        <div className="mb-4">
          <ReceivableForm customers={customers ?? []} />
        </div>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-secondary-foreground">
                  <th className="px-6 py-3 font-medium">Descrição</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Vencimento</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {receivables?.map((account) => (
                  <tr key={account.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-foreground">{account.description}</td>
                    <td className="px-6 py-3 text-secondary-foreground">
                      {(account.customer_id && customerNameById.get(account.customer_id)) ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-secondary-foreground">{formatDate(account.due_date)}</td>
                    <td className="px-6 py-3 text-foreground">{formatCurrency(account.amount)}</td>
                    <td className="px-6 py-3">
                      {account.status === "PAGO" ? (
                        <span className="text-success">Recebida</span>
                      ) : (
                        <span className="text-secondary-foreground">Pendente</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {account.status === "PENDENTE" && (
                        <MarkPaidButton
                          accountId={account.id}
                          label="Marcar recebida"
                          action={markAccountReceivablePaid}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {!receivables?.length && (
                  <tr>
                    <td className="px-6 py-6 text-secondary-foreground" colSpan={6}>
                      Nenhuma conta a receber avulsa cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div>
        <PageHeader title="Reservas com saldo pendente" description="Não editável aqui — gerencie o pagamento na própria reserva." />
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-secondary-foreground">
                  <th className="px-6 py-3 font-medium">Reserva</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Retirada/entrega</th>
                  <th className="px-6 py-3 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {pendingReservations.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3">
                      <Link
                        href={`/reservas/${order.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-secondary-foreground">
                      {(order.customer_id && customerNameById.get(order.customer_id)) ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-secondary-foreground">
                      {order.scheduled_at ? new Date(order.scheduled_at).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-6 py-3 font-medium text-error">{formatCurrency(order.balance)}</td>
                  </tr>
                ))}
                {pendingReservations.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-secondary-foreground" colSpan={4}>
                      Nenhuma reserva com saldo pendente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
