import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

export default async function RelatoriosPage() {
  const profile = await requireCurrentProfile();
  const canExport = FINANCE_ROLES.includes(profile.role as (typeof FINANCE_ROLES)[number]);

  if (!canExport) {
    return (
      <>
        <PageHeader title="Relatórios" description="Exportação de relatórios em CSV." />
        <Card>
          <CardContent className="p-6 text-sm text-secondary-foreground">
            Você não tem permissão para exportar relatórios.
          </CardContent>
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
        <Card>
          <CardHeader>
            <CardTitle>Vendas</CardTitle>
          </CardHeader>
          <form action="/relatorios/export/vendas" method="get">
            <CardContent className="grid grid-cols-2 gap-4">
              <PeriodFields />
              <div className="flex flex-col gap-2">
                <Label htmlFor="orderType">Tipo</Label>
                <Select id="orderType" name="orderType" defaultValue="ALL">
                  <option value="ALL">Vendas e reservas</option>
                  <option value="SALE">Só vendas presenciais</option>
                  <option value="RESERVATION">Só reservas</option>
                </Select>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button type="submit">Baixar CSV</Button>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque</CardTitle>
          </CardHeader>
          <form action="/relatorios/export/estoque" method="get">
            <CardContent>
              <div className="flex flex-col gap-2">
                <Label htmlFor="kind">Tipo</Label>
                <Select id="kind" name="kind" defaultValue="ALL">
                  <option value="ALL">Ingredientes e insumos</option>
                  <option value="INGREDIENTE">Só ingredientes</option>
                  <option value="INSUMO">Só insumos</option>
                </Select>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button type="submit">Baixar CSV</Button>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <form action="/relatorios/export/financeiro" method="get">
            <CardContent className="grid grid-cols-3 gap-4">
              <PeriodFields />
            </CardContent>
            <CardContent className="pt-0">
              <Button type="submit">Baixar CSV</Button>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <form action="/relatorios/export/clientes" method="get">
            <CardContent>
              <div className="flex flex-col gap-2">
                <Label htmlFor="active">Filtro</Label>
                <Select id="active" name="active" defaultValue="false">
                  <option value="false">Todos os clientes</option>
                  <option value="true">Só clientes ativos</option>
                </Select>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button type="submit">Baixar CSV</Button>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produção</CardTitle>
          </CardHeader>
          <form action="/relatorios/export/producao" method="get">
            <CardContent className="grid grid-cols-3 gap-4">
              <PeriodFields />
            </CardContent>
            <CardContent className="pt-0">
              <Button type="submit">Baixar CSV</Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </>
  );
}
