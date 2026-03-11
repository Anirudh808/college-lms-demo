"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Calendar,
  Video,
  FileCheck,
  ClipboardList,
  MessageSquare,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  Shield,
  CreditCard,
  FileText,
  Flag,
  Cpu,
  X,
} from "lucide-react";
import RightHam from "./ui/RightHam";
import LeftHam from "./ui/LeftHam";

const STUDENT_NAV = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/courses", label: "Courses", icon: BookOpen },
  { href: "/student/ai-tutor", label: "AI Tutor", icon: Bot },
  { href: "/student/live-classes", label: "Live Classes", icon: Video },
  { href: "/student/planner", label: "Planner", icon: Calendar },
  { href: "/student/integrity", label: "Integrity", icon: Shield },
];

const FACULTY_NAV = [
  { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/courses", label: "My Courses", icon: BookOpen },
  { href: "/faculty/grading", label: "Grading", icon: FileCheck },
  { href: "/faculty/question-bank", label: "Question Bank", icon: ClipboardList },
  { href: "/faculty/live-classes", label: "Live Classes", icon: Video },
  { href: "/faculty/analytics", label: "Analytics", icon: BarChart3 },
];

const HOD_NAV = [
  { href: "/hod/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hod/approval", label: "Approval Queue", icon: FileText },
  { href: "/hod/curriculum", label: "Curriculum Intelligence", icon: Cpu },
  { href: "/hod/copo", label: "CO/PO Attainment", icon: BarChart3 },
  { href: "/hod/reports", label: "Reports", icon: FileText },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/ai-governance", label: "AI Governance", icon: Cpu },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/pricing", label: "Pricing & Plans", icon: CreditCard },
];

/** Shared sidebar content — used in both mobile sheet and desktop aside */
function SidebarContent({
  isCollapsed,
  onToggle,
  onNavClick,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useSession();

  const nav =
    user?.role === "student"
      ? STUDENT_NAV
      : user?.role === "faculty"
      ? FACULTY_NAV
      : user?.role === "hod"
      ? HOD_NAV
      : ADMIN_NAV;

  return (
    <div className="flex flex-col h-full">
      {/* Header: Logo + toggle */}
      {isCollapsed ? (
        /* Collapsed: stack logo + toggle button vertically */
        <div className="py-3 border-b flex flex-col items-center gap-2 shrink-0">
          <Link href="/" title="AXON LMS">
            <GraduationCap className="w-7 h-7 text-primary" />
          </Link>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <RightHam />
          </Button>
        </div>
      ) : (
        /* Expanded: logo + toggle side by side */
        <div className="h-16 px-3 border-b flex items-center justify-between shrink-0 gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold min-w-0 overflow-hidden"
            title="AXON LMS"
          >
            <GraduationCap className="w-7 h-7 text-primary shrink-0" />
            <span className="text-base font-bold tracking-tight truncate">
              AXON LMS
            </span>
          </Link>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg hover:bg-muted"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <LeftHam />
          </Button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          const linkEl = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group",
                isCollapsed ? "justify-center w-10 mx-auto" : "gap-3",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!isCollapsed && (
                <span className="truncate leading-none">{item.label}</span>
              )}
            </Link>
          );

          return isCollapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            linkEl
          );
        })}
      </nav>

      {/* Footer: role badge */}
      {!isCollapsed && user && (
        <div className="px-3 py-3 border-t shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary uppercase">
                {user.name?.[0] ?? "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize leading-tight">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <TooltipProvider delayDuration={100}>
      {/* ─── Mobile: hamburger trigger in topbar area + overlay drawer ─── */}
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex flex-col transition-transform duration-300 ease-in-out shadow-xl lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-3 h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          isCollapsed={false}
          onToggle={() => setMobileOpen(false)}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* ─── Desktop: collapsible aside ─── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-card transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
        aria-label="Main navigation"
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((v) => !v)}
        />
      </aside>

      {/* Hidden trigger button so TopBar's Menu icon can open the mobile sidebar */}
      <button
        id="mobile-sidebar-trigger"
        className="sr-only"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        tabIndex={-1}
      />
    </TooltipProvider>
  );
}
