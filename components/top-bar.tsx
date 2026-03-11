"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { getDepartment, getProgram } from "@/lib/data";
import { getPlanDisplayName } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SwitchRolePlanForm } from "@/components/switch-role-plan-form";
import { AIUsageMeter } from "@/components/ai/ai-usage-meter";
import { RefreshCw, HelpCircle, Menu } from "lucide-react";
import { DemoTour } from "@/components/demo-tour";

export function TopBar() {
  const router = useRouter();
  const { user, tenant, plan, simulateNextDay, currentDate, logout } = useSession() as any;
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  if (!user) return null;

  const dept = getDepartment(user.departmentId as string);
  const prog = user.programId ? getProgram(user.programId as string) : null;

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 md:px-6 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile sidebar trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 shrink-0"
          aria-label="Open menu"
          onClick={() =>
            (document.getElementById("mobile-sidebar-trigger") as HTMLButtonElement)?.click()
          }
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{tenant?.name ?? "AXON Institute"}</p>
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {user.name} • {dept?.name ?? ""} {prog ? `• ${prog.code}` : ""}
          </p>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">{getPlanDisplayName(plan)}</Badge>
        <Badge variant="outline" className="capitalize hidden md:inline-flex">
          {user.role}
        </Badge>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="hidden md:block">
          <AIUsageMeter />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowTour(true)} title="Demo Tour" className="hidden sm:flex">
          <HelpCircle className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Tour</span>
        </Button>
        <Button variant="outline" size="sm" onClick={simulateNextDay} title="Simulate Next Day" className="hidden md:flex">
          <RefreshCw className="w-4 h-4 md:mr-1" />
          <span className="hidden md:inline">Simulate Day</span>
        </Button>
        <span className="text-xs text-muted-foreground hidden lg:block">Demo: {currentDate}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowSwitchModal(true)}>
              Switch Role / Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showSwitchModal} onOpenChange={setShowSwitchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Role / Plan (Demo Mode)</DialogTitle>
            <DialogDescription>
              Change your role and subscription plan for demo purposes.
            </DialogDescription>
          </DialogHeader>
          <SwitchRolePlanForm onSuccess={() => setShowSwitchModal(false)} />
        </DialogContent>
      </Dialog>

      <DemoTour open={showTour} onOpenChange={setShowTour} />
    </header>
  );
}
