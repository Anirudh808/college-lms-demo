"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";
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
  Search,
  Flag,
  Cpu,
} from "lucide-react";

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

export function AppSidebar() {
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
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="w-8 h-8 text-primary" />
          <span>AXON LMS</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
