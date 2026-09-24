"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";

export function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  const groups: { label: string | null; items: NavItem[] }[] = [];
  for (const item of items) {
    const label = item.group ?? null;
    const current = groups[groups.length - 1];
    if (current && current.label === label) {
      current.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group, index) => (
        <div key={group.label ?? `top-${index}`} className="flex flex-col gap-1">
          {group.label && (
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-secondary-foreground/70 uppercase">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground hover:bg-surface-muted",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary-foreground" : "text-secondary-foreground",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
