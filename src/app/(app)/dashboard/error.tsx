"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <EmptyState
          icon={AlertTriangle}
          title="Não foi possível carregar o dashboard"
          description="Tente novamente em instantes. Se o problema continuar, verifique sua conexão."
          action={
            <Button variant="secondary" size="sm" onClick={reset}>
              Tentar novamente
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
