import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="p-6 text-sm text-secondary-foreground">
          Módulo previsto para a {phase} do roadmap da PRAKABÁ. Ainda não implementado.
        </CardContent>
      </Card>
    </>
  );
}
