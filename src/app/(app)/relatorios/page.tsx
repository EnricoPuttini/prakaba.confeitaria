import type { ComponentType, ReactNode } from "react";
import { Boxes, ChefHat, Download, Landmark, Lock, ShoppingCart, Users } from "lucide-react";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DATE_RANGE_LABELS, DATE_RANGE_PRESETS } from "@/lib/reports/date-range";

const FINANCE_ROLES = ["OWNER", "MANAGER", "FINANCE"] as const;

function PeriodFields() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="period">Período</Label>
        <Select id="period" name="period" defaultValue="30dias">
          {DATE_RANGE_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {DATE_RANGE_LABELS[preset]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="from">De (se personalizado)</Label>
        <Input id="from" name="from" type="date" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="to">Até (se personalizado)</Label>
        <Input id="to" name="to" type="date" />
      </div>
    </>
  );
}

function ReportCard({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  action: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <form action={action} method="get">
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</CardContent>
        <CardContent className="pt-0">
          <Button type="submit" variant="secondary">
            <Download className="h-4 w-4" />
            Baixar CSV
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

export default async function RelatoriosPage() {
  const profile = await requireCurrentProfile();
  const canExport = FINANCE_ROLES.includes(profile.role as (typeof FINANCE_ROLES)[number]);

  if (!canExport) {
    return (
      <>
        <PageHeader title="Relatórios" description="Exportação de relatórios em CSV." />
        <Card>
          <EmptyState icon={Lock} title="Sem permissão" description="Você não tem permissão para exportar relatórios." />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Exportação de relatórios de vendas, estoque, financeiro, clientes e produção em CSV."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard icon={ShoppingCart} title="Vendas" action="/relatorios/export/vendas">
          <PeriodFields />
          <div className="flex flex-col gap-2">
            <Label htmlFor="orderType">Tipo</Label>
            <Select id="orderType" name="orderType" defaultValue="ALL">
              <option value="ALL">Vendas e reservas</option>
              <option value="SALE">Só vendas presenciais</option>
              <option value="RESERVATION">Só reservas</option>
            </Select>
          </div>
        </ReportCard>

        <ReportCard icon={Boxes} title="Estoque" action="/relatorios/export/estoque">
          <div className="flex flex-col gap-2">
            <Label htmlFor="kind">Tipo</Label>
            <Select id="kind" name="kind" defaultValue="ALL">
              <option value="ALL">Ingredientes e insumos</option>
              <option value="INGREDIENTE">Só ingredientes</option>
              <option value="INSUMO">Só insumos</option>
            </Select>
          </div>
        </ReportCard>

        <ReportCard icon={Landmark} title="Financeiro" action="/relatorios/export/financeiro">
          <PeriodFields />
        </ReportCard>

        <ReportCard icon={Users} title="Clientes" action="/relatorios/export/clientes">
          <div className="flex flex-col gap-2">
            <Label htmlFor="active">Filtro</Label>
            <Select id="active" name="active" defaultValue="false">
              <option value="false">Todos os clientes</option>
              <option value="true">Só clientes ativos</option>
            </Select>
          </div>
        </ReportCard>

        <ReportCard icon={ChefHat} title="Produção" action="/relatorios/export/producao">
          <PeriodFields />
        </ReportCard>
      </div>
    </>
  );
}
