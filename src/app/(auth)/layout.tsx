import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo subtitle={false} className="items-center" />
        <p className="text-sm text-secondary-foreground">Prakabá de tão bom! 🍪</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
