import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { navItemsForRole } from "@/lib/navigation";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LogoutButton } from "@/components/layout/logout-button";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietária(o)",
  MANAGER: "Gerente",
  SALES: "Vendas",
  PRODUCTION: "Produção",
  FINANCE: "Financeiro",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCurrentProfile();
  const items = navItemsForRole(profile.role);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-6 md:flex">
        <Logo />
        <SidebarNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div className="md:hidden">
            <Logo subtitle={false} />
          </div>
          <div className="hidden text-sm text-secondary-foreground md:block">
            {profile.organizationName}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{profile.fullName}</p>
              <p className="text-xs text-secondary-foreground">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
