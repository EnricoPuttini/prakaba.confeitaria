import type { UserRole } from "@/lib/supabase/types";

export type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["OWNER", "MANAGER", "SALES", "PRODUCTION", "FINANCE"] },
  { href: "/pdv", label: "PDV", roles: ["OWNER", "MANAGER", "SALES"] },
  { href: "/operacoes", label: "Operações", roles: ["OWNER", "MANAGER", "SALES"] },
  { href: "/reservas", label: "Reservas", roles: ["OWNER", "MANAGER", "SALES"] },
  { href: "/produtos", label: "Produtos", roles: ["OWNER", "MANAGER", "PRODUCTION"] },
  { href: "/estoque", label: "Estoque", roles: ["OWNER", "MANAGER", "PRODUCTION"] },
  { href: "/producao", label: "Produção", roles: ["OWNER", "MANAGER", "PRODUCTION"] },
  { href: "/clientes", label: "Clientes", roles: ["OWNER", "MANAGER", "SALES"] },
  { href: "/financeiro", label: "Financeiro", roles: ["OWNER", "MANAGER", "FINANCE"] },
  { href: "/relatorios", label: "Relatórios", roles: ["OWNER", "MANAGER", "FINANCE"] },
  { href: "/usuarios", label: "Usuários", roles: ["OWNER", "MANAGER"] },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
