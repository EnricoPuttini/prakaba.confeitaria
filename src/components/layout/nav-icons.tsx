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
  type LucideIcon,
} from "lucide-react";
import type { NavIconName } from "@/lib/navigation";

export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  pdv: ShoppingCart,
  operacoes: Wallet,
  reservas: CalendarClock,
  produtos: Package,
  estoque: Boxes,
  producao: ChefHat,
  clientes: Users,
  financeiro: Landmark,
  relatorios: FileBarChart,
  usuarios: UserCog,
};
