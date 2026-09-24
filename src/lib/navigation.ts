import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  CalendarClock,
  Package,
  Boxes,
  ChefHat,
  Users,
  Landmark,
  FileBarChart,
  UserCog,
} from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

export type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
  icon: LucideIcon;
  group?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["OWNER", "MANAGER", "SALES", "PRODUCTION", "FINANCE"],
    icon: LayoutDashboard,
  },
  { href: "/pdv", label: "PDV", roles: ["OWNER", "MANAGER", "SALES"], icon: ShoppingCart, group: "Vendas" },
  { href: "/operacoes", label: "Operações", roles: ["OWNER", "MANAGER", "SALES"], icon: Wallet, group: "Vendas" },
  {
    href: "/reservas",
    label: "Reservas",
    roles: ["OWNER", "MANAGER", "SALES"],
    icon: CalendarClock,
    group: "Vendas",
  },
  {
    href: "/produtos",
    label: "Produtos",
    roles: ["OWNER", "MANAGER", "PRODUCTION"],
    icon: Package,
    group: "Catálogo",
  },
  {
    href: "/estoque",
    label: "Estoque",
    roles: ["OWNER", "MANAGER", "PRODUCTION"],
    icon: Boxes,
    group: "Catálogo",
  },
  {
    href: "/producao",
    label: "Produção",
    roles: ["OWNER", "MANAGER", "PRODUCTION"],
    icon: ChefHat,
    group: "Catálogo",
  },
  {
    href: "/clientes",
    label: "Clientes",
    roles: ["OWNER", "MANAGER", "SALES"],
    icon: Users,
    group: "Relacionamento",
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    roles: ["OWNER", "MANAGER", "FINANCE"],
    icon: Landmark,
    group: "Financeiro",
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    roles: ["OWNER", "MANAGER", "FINANCE"],
    icon: FileBarChart,
    group: "Financeiro",
  },
  {
    href: "/usuarios",
    label: "Usuários",
    roles: ["OWNER", "MANAGER"],
    icon: UserCog,
    group: "Administração",
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
