"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  Hammer,
  LayoutGrid,
  Lock,
  LogOut,
  Map,
  Menu,
  Network,
  Route,
  Sliders,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";

const menuItems = [
  { icon: Network, label: "Estrutura", href: "/estrutura", enabled: true },
  { icon: Wrench, label: "Equipamentos", href: "/equipamentos", enabled: true },
  { icon: Boxes, label: "Modelos", href: "/modelos", enabled: true },
  { icon: Map, label: "Áreas", href: "/areas", enabled: true },
  { icon: LayoutGrid, label: "Setores", href: "/setores", enabled: true },
  { icon: Hammer, label: "Serviços", href: "/servicos", enabled: true },
  { icon: Route, label: "Planejamento", href: "/planejamento", enabled: true },
  {
    icon: CalendarDays,
    label: "Programação",
    href: "/programacao",
    enabled: true,
  },
  {
    icon: ClipboardList,
    label: "Ordens de Serviço",
    href: "/ordens-servico",
    enabled: true,
  },
  {
    icon: AlertTriangle,
    label: "Anomalias",
    href: "/anomalias",
    enabled: true,
  },
  { icon: Users, label: "Usuários", href: "/usuarios", enabled: true },
  { icon: Sliders, label: "Parâmetros", href: "/parametros", enabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const { profile, loading, initials, roleLabel } = useAdminProfile();
  const router = useRouter();

  const handleLogout = () => {
    setUserMenuOpen(false);
    signOut();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "relative z-20 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Header / Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        {!isCollapsed && (
          <span className="text-primary text-xl font-bold tracking-tight">
            TechLub<span className="font-medium text-slate-700">ADM</span>
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-primary/10 hover:text-primary rounded-md p-2 text-slate-500 transition-colors"
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        <TooltipProvider>
          {menuItems.map((item) => {
            const isActive = pathname === item.href && item.enabled;
            const isDisabled = !item.enabled;
            const enabledLinkClass = cn(
              "group relative flex items-center rounded-xl transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md font-medium"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
            );
            const disabledLinkClass = cn(
              "group relative flex items-center rounded-xl transition-all duration-200",
              "cursor-not-allowed pointer-events-none",
              "bg-slate-50/80 text-slate-400 border border-slate-100",
            );
            const iconClass = cn(
              "h-5 w-5 shrink-0",
              isActive
                ? "text-primary-foreground"
                : isDisabled
                  ? "text-slate-400"
                  : "text-slate-500 group-hover:text-slate-700",
            );
            const content = (
              <>
                <item.icon className={iconClass} />
                {!isCollapsed && (
                  <span className={cn("text-sm", isActive && "font-medium")}>
                    {item.label}
                  </span>
                )}
              </>
            );
            return (
              <div key={item.href}>
                {isCollapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      {item.enabled ? (
                        <Link
                          href={item.href}
                          className={cn(enabledLinkClass, "justify-center p-3")}
                        >
                          <item.icon
                            className={cn(
                              "h-6 w-6",
                              isActive
                                ? "text-primary-foreground"
                                : "text-slate-600",
                            )}
                          />
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            disabledLinkClass,
                            "justify-center p-3",
                          )}
                          aria-disabled="true"
                        >
                          <Lock className="h-5 w-5 text-slate-400" />
                        </span>
                      )}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="border-0 bg-slate-900 text-white"
                    >
                      {item.label}
                      {isDisabled && (
                        <span className="ml-1.5 text-slate-300">
                          (indisponível)
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : item.enabled ? (
                  <Link
                    href={item.href}
                    className={cn(enabledLinkClass, "gap-3 px-4 py-3")}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className={cn(disabledLinkClass, "gap-3 px-4 py-3")}
                    aria-disabled="true"
                  >
                    {content}
                  </span>
                )}
              </div>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer / User Profile + Logout */}
      <div className="border-t border-slate-100 p-4">
        <div
          ref={userMenuRef}
          className={cn(
            "relative flex items-center gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="focus:ring-primary/20 flex shrink-0 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label="Abrir menu do usuário"
          >
            <div className="bg-primary/20 text-primary flex h-10 w-10 items-center justify-center rounded-full font-bold ring-2 ring-transparent transition-shadow hover:ring-slate-200">
              {loading ? "…" : initials}
            </div>
          </button>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-900">
                {loading ? "Carregando..." : (profile?.name ?? "Admin")}
              </p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
          )}

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className="absolute right-0 bottom-full left-0 z-50 mb-2 min-w-[120px] rounded-lg border border-slate-200 bg-white py-1 shadow-md"
                role="menu"
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4 text-slate-500" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
