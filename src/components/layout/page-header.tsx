export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h1 className="font-brand text-2xl font-semibold text-foreground">{title}</h1>
      {description && <p className="text-sm text-secondary-foreground">{description}</p>}
    </div>
  );
}
