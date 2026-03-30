"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderKanban, Settings, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/dashboard/projects", label: "Projets", icon: FolderKanban },
  { href: "/dashboard/settings", label: "Parametres", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight">
            Challenge 48h
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", collapsed && "mx-auto")}
          onClick={onToggle}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t px-4 py-3 flex gap-3 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:underline underline-offset-4">
            Confidentialite
          </Link>
          <Link href="/mentions-legales" className="hover:underline underline-offset-4">
            Mentions legales
          </Link>
        </div>
      )}
    </aside>
  );
}
