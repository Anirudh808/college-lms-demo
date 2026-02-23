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
import { RefreshCw, HelpCircle } from "lucide-react";
import { DemoTour } from "@/components/demo-tour";

export function TopBar() {
  const router = useRouter();
  const { user, tenant, plan, simulateNextDay, currentDate, logout } = useSession();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  if (!user) return null;

  const dept = getDepartment(user.departmentId);
  const prog = user.programId ? getProgram(user.programId) : null;

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm font-medium">{tenant?.name ?? "AXON Institute"}</p>
          <p className="text-xs text-muted-foreground">
            {user.name} • {dept?.name ?? ""} {prog ? `• ${prog.code}` : ""}
          </p>
        </div>
        <Badge variant="secondary">{getPlanDisplayName(plan)}</Badge>
        <Badge variant="outline" className="capitalize">
          {user.role}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <AIUsageMeter />
        <Button variant="outline" size="sm" onClick={() => setShowTour(true)} title="Demo Tour">
          <HelpCircle className="w-4 h-4 mr-1" />
          Tour
        </Button>
        <Button variant="outline" size="sm" onClick={simulateNextDay} title="Simulate Next Day">
          <RefreshCw className="w-4 h-4 mr-1" />
          Simulate Next Day
        </Button>
        <span className="text-xs text-muted-foreground">Demo: {currentDate}</span>

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
