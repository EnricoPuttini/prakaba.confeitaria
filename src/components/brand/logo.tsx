import { cn } from "@/lib/utils";

// Nenhum arquivo de logo foi fornecido ao projeto; este wordmark tipográfico
// segue a identidade descrita (serifada, azul-marinho, subtítulo suave) até
// que o arquivo oficial da logo seja adicionado em public/ e usado via <Image>.
export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="font-brand text-2xl font-semibold tracking-wide text-primary">
        PRAKABÁ
      </span>
      {subtitle && (
        <span className="text-xs tracking-wide text-secondary-foreground">
          cookies e brownies
        </span>
      )}
    </div>
  );
}
