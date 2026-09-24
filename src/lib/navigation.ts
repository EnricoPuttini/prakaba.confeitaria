import type { UserRole } from "@/lib/supabase/types";

export type NavIconName =
  | "dashboard"
  | "pdv"
  | "operacoes"
  | "reservas"
  | "produtos"
  | "estoque"
  | "producao"
  | "clientes"
  | "financeiro"
  | "relatorios"
  | "usuarios";

export type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
  icon: NavIconName;
  group?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["OWNER", "MANAGER", "SALES", "PRODUCTION", "FINANCE"],
    icon: "dashboard",
  },
  { href: "/pdv", label: "PDV", roles: ["OWNER", "MANAGER", "SALES"], icon: "pdv", group: "Vendas" },
  { href: "/operacoes", label: "Operações", roles: ["OWNER", "MANAGER", "SALES"], icon: "operacoes", group: "Vendas" },
  {
    href: "/reservas",
    label: "Reservas",
    roles: ["OWNER", "MANAGER", "SALES"],
    icon: "reservas",
    group: "Vendas",
  },
  {
    href: "/produtos",
    label: "Produtos",
    roles: ["OWNER", "MANAGER", "PRODUCTION"],
    icon: "produtos",
    group: "Catálogo",
  },
  {
    href: "/estoque",
    label: "Estoque",
    roles: ["OWNER", "MANAGER", "PRODUCTION"],
    icon: "estoque",
    group: "Catálogo",
  },
  {
    href: "/producao",
    label: "Produção",
    roles: ["OWNER", "MANAGER", "PRODUCTION"],
    icon: "producao",
    group: "Catálogo",
  },
  {
    href: "/clientes",
    label: "Clientes",
    roles: ["OWNER", "MANAGER", "SALES"],
    icon: "clientes",
    group: "Relacionamento",
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    roles: ["OWNER", "MANAGER", "FINANCE"],
    icon: "financeiro",
    group: "Financeiro",
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    roles: ["OWNER", "MANAGER", "FINANCE"],
    icon: "relatorios",
    group: "Financeiro",
  },
  {
    href: "/usuarios",
    label: "Usuários",
    roles: ["OWNER", "MANAGER"],
    icon: "usuarios",
    group: "Administração",
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
