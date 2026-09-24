import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { navItemsForRole } from "@/lib/navigation";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietária(o)",
  MANAGER: "Gerente",
  SALES: "Vendas",
  PRODUCTION: "Produção",
  FINANCE: "Financeiro",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCurrentProfile();
  const items = navItemsForRole(profile.role);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col gap-8 border-r border-border bg-surface p-6 md:flex">
        <Logo />
        <SidebarNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <MobileNav items={items} />
            <div className="md:hidden">
              <Logo subtitle={false} className="h-8 w-auto" />
            </div>
            <div className="hidden text-sm text-secondary-foreground md:block">
              {profile.organizationName}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{profile.fullName}</p>
              <Badge tone="primary" className="mt-0.5">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary"
              aria-hidden="true"
            >
              {initials(profile.fullName)}
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
